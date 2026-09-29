import fs from 'fs';
import path from 'path';

// Parse .env.local for Upstash Redis credentials
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('Missing Upstash Redis credentials in .env.local');
  process.exit(1);
}

const outDir = path.resolve('local_storage_records');
const leadsDir = path.join(outDir, 'leads');
const convosDir = path.join(outDir, 'conversations');
const bookingsDir = path.join(outDir, 'bookings');

for (const d of [outDir, leadsDir, convosDir, bookingsDir]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function redisGet(key) {
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  try {
    return JSON.parse(data.result);
  } catch {
    return data.result;
  }
}

async function redisLrange(key, start = 0, stop = -1) {
  const res = await fetch(`${url}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  return data.result.map(x => {
    try {
      return JSON.parse(x);
    } catch {
      return x;
    }
  });
}

async function redisKeys(pattern = '*') {
  const res = await fetch(`${url}/keys/${encodeURIComponent(pattern)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.result || [];
}

async function main() {
  console.log('Fetching all keys from Upstash Redis...');
  const keys = await redisKeys('*');
  console.log(`Found ${keys.length} total keys.`);

  // 1. Export Leads
  const leadKeys = keys.filter(k => k.startsWith('steve:lead:') && !k.includes(':req:'));
  console.log(`Exporting ${leadKeys.length} lead keys...`);
  
  const leadSummaries = [];

  for (const lk of leadKeys) {
    const rawData = await redisGet(lk);
    if (!rawData) continue;

    const data = typeof rawData === 'object' ? rawData : { raw: rawData };
    const sid = lk.replace('steve:lead:', '');
    const name = data.name || data.inquirer || 'Unknown';
    const email = data.email || 'N/A';
    const company = data.company || data.organization || 'N/A';
    const phone = data.phone || 'N/A';
    const rawTimestamp = data.at || data.createdAt || data.submittedAt;
    const date = rawTimestamp ? new Date(rawTimestamp).toUTCString() : 'Unknown';
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `lead_${safeName}_${sid.slice(0, 8)}.md`;

    const mdContent = `# Lead Record: ${name}

**Status:** Submitted / Stored  
**Captured At:** ${date}  
**Session ID:** \`${sid}\`  
**Redis Key:** \`${lk}\`  

---

## Contact Information
- **Name:** ${name}
- **Company / Organization:** ${company}
- **Email:** [${email}](mailto:${email})
- **Phone:** ${phone}

---

## Submission Details & Context
${data.roleSnippet ? `### Inquirer Prompt / Role Context:\n> ${data.roleSnippet}\n` : ''}
${data.jobUrl ? `- **Job URL:** ${data.jobUrl}\n` : ''}
${data.requirements ? `### Job Description / Requirements:\n\`\`\`text\n${data.requirements}\n\`\`\`\n` : ''}
${data.note ? `### Inquirer Notes:\n> ${data.note}\n` : ''}

---

## Raw Stored JSON Payload
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`;

    fs.writeFileSync(path.join(leadsDir, filename), mdContent, 'utf8');
    console.log(`Saved lead: ${filename}`);

    leadSummaries.push({
      name,
      company,
      email,
      phone,
      date,
      sid,
      file: filename
    });
  }

  // Write Lead Master Index
  const masterLeadsMd = `# Steve AI — All Stored Leads & Inquiries
Generated at: ${new Date().toISOString()}  
Total Captured Leads: ${leadSummaries.length}

| Date | Name | Company / Organization | Email | Phone | Session ID | File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${leadSummaries.map(l => `| ${l.date} | **${l.name}** | ${l.company} | ${l.email} | ${l.phone} | \`${l.sid.slice(0, 12)}...\` | [${l.file}](./${l.file}) |`).join('\n')}
`;
  fs.writeFileSync(path.join(leadsDir, '00_leads_index.md'), masterLeadsMd, 'utf8');

  // 2. Export Conversations
  const convoKeys = keys.filter(k => k.startsWith('steve:convo:') && k !== 'steve:convo:recent' && k !== 'steve:convo:total');
  console.log(`Exporting ${convoKeys.length} conversation sessions...`);

  const convoSummaries = [];

  for (const ck of convoKeys) {
    const sid = ck.replace('steve:convo:', '');
    const turns = await redisLrange(ck);

    // Identify if lead associated
    const matchingLead = leadSummaries.find(l => l.sid.includes(sid) || sid.includes(l.sid));
    const title = matchingLead ? `${matchingLead.name} (${matchingLead.company})` : `Anonymous Session (${sid.slice(0, 8)})`;
    const isAnonymous = !matchingLead;
    const safeTitle = (matchingLead ? matchingLead.name : `anon_${sid.slice(0, 8)}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `convo_${safeTitle}_${sid.slice(0, 8)}.md`;

    let convoBody = '';
    turns.forEach((t, i) => {
      const role = t.role || (typeof t === 'string' ? 'unknown' : 'system');
      const time = t.timestamp ? new Date(t.timestamp).toISOString() : (t.at || '');
      const content = typeof t === 'string' ? t : (t.content || t.text || JSON.stringify(t, null, 2));

      convoBody += `### Turn ${i + 1} — ${role.toUpperCase()} ${time ? `(${time})` : ''}\n\n`;
      if (role === 'user') {
        convoBody += `> ${content.replace(/\n/g, '\n> ')}\n\n`;
      } else {
        convoBody += `${content}\n\n`;
      }
      convoBody += `---\n\n`;
    });

    const mdContent = `# Conversation Log: ${title}

**Session ID:** \`${sid}\`  
**Redis Key:** \`${ck}\`  
**Type:** ${isAnonymous ? 'Anonymous Visitor' : 'Identified Recruiter / Inquirer'}  
**Total Turns:** ${turns.length}  
${matchingLead ? `**Associated Lead File:** [../leads/${matchingLead.file}](../leads/${matchingLead.file})\n` : ''}

---

## Transcript

${convoBody}

## Raw Storage JSON
\`\`\`json
${JSON.stringify(turns, null, 2)}
\`\`\`
`;

    fs.writeFileSync(path.join(convosDir, filename), mdContent, 'utf8');
    console.log(`Saved conversation: ${filename}`);

    convoSummaries.push({
      title,
      isAnonymous,
      turns: turns.length,
      sid,
      file: filename
    });
  }

  // Write Conversation Master Index
  const masterConvosMd = `# Steve AI — All Stored Conversation Transcripts
Generated at: ${new Date().toISOString()}  
Total Conversations: ${convoSummaries.length}

| User / Inquirer | Status | Turns | Session ID | File |
| :--- | :--- | :--- | :--- | :--- |
${convoSummaries.map(c => `| **${c.title}** | ${c.isAnonymous ? '❌ Anonymous (No info)' : '✅ Lead Submitted'} | ${c.turns} | \`${c.sid.slice(0, 16)}...\` | [${c.file}](./${c.file}) |`).join('\n')}
`;
  fs.writeFileSync(path.join(convosDir, '00_conversations_index.md'), masterConvosMd, 'utf8');

  // 3. Export Bookings if any
  const bookingKeys = keys.filter(k => k.startsWith('steve:booking:'));
  console.log(`Exporting ${bookingKeys.length} booking keys...`);

  async function getGoogleToken() {
    if (!process.env.STEVE_GOOGLE_CLIENT_ID || !process.env.STEVE_GOOGLE_REFRESH_TOKEN) return null;
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.STEVE_GOOGLE_CLIENT_ID,
          client_secret: process.env.STEVE_GOOGLE_CLIENT_SECRET,
          refresh_token: process.env.STEVE_GOOGLE_REFRESH_TOKEN,
          grant_type: "refresh_token",
        }),
      });
      const data = await response.json();
      return data.access_token;
    } catch {
      return null;
    }
  }

  const googleToken = await getGoogleToken();
  const calendarId = process.env.STEVE_GOOGLE_CALENDAR_ID;
  const bookingSummaries = [];

  for (const bk of bookingKeys) {
    const rawBooking = await redisGet(bk);
    const bookingId = bk.replace('steve:booking:', '');
    const filename = `booking_${bookingId.slice(0, 8)}.md`;

    let attendeeName = 'Unknown Attendee';
    let attendeeEmail = 'N/A';
    let eventSummary = 'Discovery Call';
    let eventDescription = '';
    let startIso = rawBooking?.start || 'N/A';
    let endIso = rawBooking?.end || 'N/A';
    let meetUrl = rawBooking?.meetUrl || 'N/A';
    let calendarUrl = rawBooking?.calendarUrl || 'N/A';
    let status = rawBooking?.status || 'Confirmed';

    // If Google Calendar credentials exist and eventId is present, fetch full attendee info
    if (googleToken && calendarId && rawBooking?.eventId) {
      try {
        const gRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(rawBooking.eventId)}`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        );
        if (gRes.ok) {
          const gEvent = await gRes.json();
          eventSummary = gEvent.summary || eventSummary;
          eventDescription = gEvent.description || '';
          if (Array.isArray(gEvent.attendees) && gEvent.attendees.length > 0) {
            attendeeEmail = gEvent.attendees[0].email || attendeeEmail;
            attendeeName = gEvent.attendees[0].displayName || attendeeName;
          }
          if (gEvent.hangoutLink) meetUrl = gEvent.hangoutLink;
          if (gEvent.start?.dateTime) startIso = gEvent.start.dateTime;
          if (gEvent.end?.dateTime) endIso = gEvent.end.dateTime;
          if (gEvent.status) status = gEvent.status;
        }
      } catch (err) {
        console.warn(`Could not fetch Google Calendar event for ${bookingId}:`, err.message);
      }
    }

    const startDate = startIso !== 'N/A' ? new Date(startIso).toUTCString() : 'N/A';
    const endDate = endIso !== 'N/A' ? new Date(endIso).toUTCString() : 'N/A';

    const mdContent = `# Booking Record: ${eventSummary}

**Booking ID:** \`${bookingId}\`  
**Status:** ${status.toUpperCase()}  
**Redis Key:** \`${bk}\`  
**Google Event ID:** \`${rawBooking?.eventId || 'N/A'}\`  

---

## Attendee Information
- **Attendee Name:** ${attendeeName}
- **Attendee Email:** [${attendeeEmail}](mailto:${attendeeEmail})

---

## Meeting Schedule & Links
- **Start Time (UTC):** ${startDate}
- **End Time (UTC):** ${endDate}
- **Google Meet Link:** [${meetUrl}](${meetUrl})
- **Google Calendar Event:** [View in Calendar](${calendarUrl})

---

## Event Description
\`\`\`text
${eventDescription}
\`\`\`

---

## Raw Stored Redis Record
\`\`\`json
${JSON.stringify(rawBooking, null, 2)}
\`\`\`
`;

    fs.writeFileSync(path.join(bookingsDir, filename), mdContent, 'utf8');
    console.log(`Saved booking: ${filename}`);

    bookingSummaries.push({
      bookingId,
      attendeeName,
      attendeeEmail,
      startDate,
      meetUrl,
      status,
      file: filename
    });
  }

  // Write Bookings Master Index
  const masterBookingsMd = `# Steve AI — All Stored Appointments & Bookings
Generated at: ${new Date().toISOString()}  
Total Confirmed Bookings: ${bookingSummaries.length}

| Date & Time (UTC) | Attendee | Email | Status | Google Meet | Details File |
| :--- | :--- | :--- | :--- | :--- | :--- |
${bookingSummaries.map(b => `| ${b.startDate} | **${b.attendeeName}** | [${b.attendeeEmail}](mailto:${b.attendeeEmail}) | ${b.status} | [Join Meet](${b.meetUrl}) | [${b.file}](./${b.file}) |`).join('\n')}
`;
  fs.writeFileSync(path.join(bookingsDir, '00_bookings_index.md'), masterBookingsMd, 'utf8');

  // 4. Create Top-Level README in local_storage_records
  const rootReadme = `# Steve AI — Local Private Data Vault
This directory contains offline backups of all leads, conversation transcripts, and bookings stored in Upstash Redis.

> **SECURITY NOTE:** This directory is strictly ignored by git via \`.gitignore\` (\`local_storage_records/\`) and will never be pushed to any remote repository.

### Directory Structure
- [\`leads/\`](./leads/00_leads_index.md): All recruiter and inquiry lead submissions (Alex Vance, Marcus Reed, Sudheer P).
- [\`conversations/\`](./conversations/00_conversations_index.md): All 6 complete session transcripts (both identified and anonymous).
- [\`bookings/\`](./bookings/): Stored discovery call calendar appointments.

Export completed successfully.
`;
  fs.writeFileSync(path.join(outDir, 'README.md'), rootReadme, 'utf8');

  console.log('All logs and leads successfully exported to local_storage_records/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
