import {
  createHmac,
  createHash,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { redis } from "./assistant.js";
import { enabled, safeUrl } from "./config.js";

const ZONE = "Europe/London";
const SLOT_MS = 20 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export function calendarConfigured() {
  return (
    enabled("booking") &&
    Boolean(
      process.env.STEVE_GOOGLE_CLIENT_ID &&
      process.env.STEVE_GOOGLE_CLIENT_SECRET &&
      process.env.STEVE_GOOGLE_REFRESH_TOKEN &&
      process.env.STEVE_GOOGLE_CALENDAR_ID,
    )
  );
}

function fmtParts(date) {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(values.map((part) => [part.type, part.value]));
}

export function localToUtc(date, hour, minute) {
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = target;
  for (let i = 0; i < 3; i++) {
    const p = fmtParts(new Date(candidate));
    const represented = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    candidate += target - represented;
  }
  return new Date(candidate);
}

function localDate(date) {
  const p = fmtParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function addLocalDays(dateString, count) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + count));
  return date.toISOString().slice(0, 10);
}

function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().startsWith(value)
  );
}

async function accessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STEVE_GOOGLE_CLIENT_ID,
      client_secret: process.env.STEVE_GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.STEVE_GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Calendar authorization is unavailable.");
  const token = await response.json();
  if (!token.access_token)
    throw new Error("Calendar authorization is unavailable.");
  return token.access_token;
}

async function google(path, token, options = {}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/${path}`,
    {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      signal: AbortSignal.timeout(12_000),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error("Google Calendar could not verify that request."),
      { status: response.status, providerError: true },
    );
  return data;
}

async function busyRanges(token, start, end) {
  const calendarId = process.env.STEVE_GOOGLE_CALENDAR_ID;
  const data = await google("freeBusy", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      timeZone: ZONE,
      items: [{ id: calendarId }],
    }),
  });
  const calendar = data.calendars?.[calendarId];
  if (!calendar || calendar.errors?.length || !Array.isArray(calendar.busy))
    throw new Error("Calendar availability could not be verified.");
  return calendar.busy.map((range) => [
    Date.parse(range.start),
    Date.parse(range.end),
  ]);
}

function free(start, end, ranges) {
  return !ranges.some(
    ([busyStart, busyEnd]) => start < busyEnd && end > busyStart,
  );
}

export function slotToken(start, end, sid) {
  const secret = process.env.STEVE_SESSION_SECRET;
  const body = Buffer.from(
    JSON.stringify({
      start: start.toISOString(),
      end: end.toISOString(),
      sid,
      bookingId: randomUUID(),
      expires: Date.now() + 30 * 60_000,
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

export function readSlotToken(value, sid, allowExpired = false) {
  if (typeof value !== "string" || value.length > 700) return null;
  const [body, sig, extra] = value.split(".");
  if (extra) return null;
  if (!body || !sig) return null;
  const expected = createHmac("sha256", process.env.STEVE_SESSION_SECRET)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig),
    b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (
      (!allowExpired && Date.now() > data.expires) ||
      data.sid !== sid ||
      !sid ||
      !/^[a-f0-9-]{36}$/.test(data.bookingId || "") ||
      Date.parse(data.end) - Date.parse(data.start) !== SLOT_MS
    )
      return null;
    return data;
  } catch {
    return null;
  }
}

export async function availableSlots(requestedDate = "", sid) {
  const now = Date.now();
  const earliest = now + 24 * 60 * 60_000;
  const rangeStart = new Date(earliest);
  const firstDay = requestedDate || localDate(rangeStart);
  const maxDay = addLocalDays(localDate(new Date(now)), 30);
  if (
    !validDate(firstDay) ||
    firstDay < localDate(rangeStart) ||
    firstDay > maxDay
  )
    throw Object.assign(
      new Error(
        "Choose a date within the next 30 days and at least 24 hours away.",
      ),
      { status: 400 },
    );
  const rangeEnd = localToUtc(
    addLocalDays(firstDay, requestedDate ? 1 : 8),
    21,
    0,
  );
  const access = await accessToken();
  const busy = await busyRanges(
    access,
    new Date(Math.max(earliest, localToUtc(firstDay, 14, 0).getTime())),
    rangeEnd,
  );
  const days = requestedDate ? 1 : 8;
  const slots = [];
  const maxSlots = requestedDate ? 40 : 48;
  for (let day = 0; day < days && slots.length < maxSlots; day++) {
    const date = addLocalDays(firstDay, day);
    if (date > maxDay) break;
    let dailyCount = 0;
    for (
      let minute = 14 * 60;
      minute <= 20 * 60 + 10 && slots.length < maxSlots;
      minute += 10
    ) {
      const start = localToUtc(date, Math.floor(minute / 60), minute % 60);
      const end = new Date(start.getTime() + SLOT_MS);
      if (start.getTime() < earliest || end > localToUtc(date, 20, 30))
        continue;
      if (
        dailyCount < (requestedDate ? 38 : 8) &&
        free(start.getTime(), end.getTime(), busy)
      ) {
        dailyCount++;
        slots.push({
          token: slotToken(start, end, sid),
          start: start.toISOString(),
          end: end.toISOString(),
          timeZone: ZONE,
          label: new Intl.DateTimeFormat("en-GB", {
            timeZone: ZONE,
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).format(start),
        });
      }
    }
  }
  return slots.map((slot) => ({
    ...slot,
    bookingId: readSlotToken(slot.token, sid).bookingId,
  }));
}

export function validateBookingWindow(slot, now = Date.now()) {
  const start = new Date(slot.start),
    end = new Date(slot.end);
  if (!Number.isFinite(start.getTime()) || end - start !== SLOT_MS)
    return false;
  const p = fmtParts(start),
    minute = Number(p.hour) * 60 + Number(p.minute);
  return (
    start.getTime() >= now + DAY_MS &&
    localDate(start) <= addLocalDays(localDate(new Date(now)), 30) &&
    minute >= 840 &&
    minute <= 1210 &&
    Number(p.minute) % 10 === 0 &&
    Number(p.second) === 0 &&
    start.getUTCMilliseconds() === 0
  );
}

function recordKey(id) {
  return `steve:booking:${id}`;
}
async function save(record) {
  const ttl = Math.max(
    1800,
    Math.ceil((Date.parse(record.end) + 30 * DAY_MS - Date.now()) / 1000),
  );
  await redis([
    "SET",
    recordKey(record.bookingId),
    JSON.stringify(record),
    "EX",
    String(ttl),
  ]);
}
async function load(id, sid) {
  if (!/^[a-f0-9-]{36}$/.test(id || "")) return null;
  const raw = await redis(["GET", recordKey(id)]);
  const record = raw ? JSON.parse(raw) : null;
  return record?.sid === sid ? record : null;
}
function result(record) {
  return {
    bookingId: record.bookingId,
    status: record.status,
    confirmed: record.status === "confirmed",
    start: record.start,
    end: record.end,
    timeZone: ZONE,
    calendarUrl: record.calendarUrl || "",
    meetUrl: record.meetUrl || "",
    conflict: Boolean(record.conflict),
    invitation:
      record.status === "confirmed"
        ? "The event is confirmed. Invitation delivery is managed by Google."
        : "The outcome is being checked. Do not submit another booking.",
    message: record.conflict
      ? "A calendar conflict was detected. Contact Sudheer to resolve it; neither event has been cancelled."
      : record.message || "",
  };
}
async function eventFor(record, access) {
  try {
    return await google(
      `calendars/${encodeURIComponent(process.env.STEVE_GOOGLE_CALENDAR_ID)}/events/${record.eventId}`,
      access,
    );
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}
async function finish(record, event, access) {
  if (
    event.extendedProperties?.private?.steveBookingId !== record.bookingId ||
    event.status === "cancelled"
  )
    throw new Error("Booking could not be verified.");
  record.status = "confirmed";
  record.calendarUrl = safeUrl(event.htmlLink);
  const meet =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")
      ?.uri;
  record.meetUrl = /^https:\/\/meet\.google\.com\//.test(meet || "")
    ? meet
    : "";
  // Manual calendar writes cannot be locked by Redis. Detect and report, never auto-delete.
  try {
    const query = new URLSearchParams({
      timeMin: record.start,
      timeMax: record.end,
      singleEvents: "true",
      maxResults: "250",
    });
    const events = await google(
      `calendars/${encodeURIComponent(process.env.STEVE_GOOGLE_CALENDAR_ID)}/events?${query}`,
      access,
    );
    record.conflict =
      Boolean(events.nextPageToken) ||
      (events.items || []).some(
        (e) =>
          e.id !== record.eventId &&
          e.status !== "cancelled" &&
          e.transparency !== "transparent" &&
          !e.attendees?.some((a) => a.self && a.responseStatus === "declined"),
      );
    record.conflictCheck = "complete";
    record.message = "";
  } catch {
    record.conflictCheck = "pending";
    record.message =
      "Event confirmed; the follow-up conflict check is pending.";
  }
  await save(record);
  await redis([
    "EVAL",
    "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
    "1",
    `steve:booking-active:${record.sid}`,
    record.bookingId,
  ]);
  return result(record);
}

export async function recoverBooking(id, sid) {
  const record = await load(id, sid);
  if (!record)
    throw Object.assign(
      new Error(
        "Booking record not found for this session. Contact Sudheer if you already confirmed.",
      ),
      { status: 404 },
    );
  if (record.status === "failed") return result(record);
  try {
    const access = await accessToken(),
      event = await eventFor(record, access);
    if (event?.status === "cancelled") {
      record.status = "failed";
      record.message =
        "Google reports that this appointment was cancelled. No replacement has been created.";
      await save(record);
      return result(record);
    }
    if (event) return await finish(record, event, access);
    if (record.status === "confirmed") {
      record.status = "pending";
      record.message =
        "The previously created event could not be verified. Contact Sudheer before making another booking.";
      await save(record);
    }
    // Recovery never creates an event. A timed-out insert may still be committing.
  } catch {
    /* Keep uncertain outcomes pending without disclosing provider data. */
  }
  return result(record);
}

export async function createOrRecoverBooking(
  slot,
  name,
  email,
  purpose,
  sid,
  phone = "",
  notes = "",
) {
  const existing = await load(slot.bookingId, sid);
  if (existing) return recoverBooking(slot.bookingId, sid);
  if (!validateBookingWindow(slot) || slot.expires < Date.now())
    throw Object.assign(
      new Error("That time is no longer eligible. Please choose another slot."),
      { status: 409 },
    );
  const calendarId = process.env.STEVE_GOOGLE_CALENDAR_ID;
  const prefix = `steve:interval:${createHash("sha256").update(calendarId).digest("hex").slice(0, 24)}`;
  const bucket = Date.parse(slot.start) / 600000;
  const keys = [
    `${prefix}:${bucket}`,
    `${prefix}:${bucket + 1}`,
    `steve:booking-active:${sid}`,
  ];
  const owner = slot.bookingId;
  // Pending reservations survive provider timeouts; status recovery is the only retry path.
  const ttl = Math.max(
    120,
    Math.ceil((Date.parse(slot.end) - Date.now()) / 1000),
  );
  const locked = await redis([
    "EVAL",
    "for _,k in ipairs(KEYS) do if redis.call('EXISTS',k)==1 then return 0 end end; for _,k in ipairs(KEYS) do redis.call('SET',k,ARGV[1],'EX',ARGV[2]) end; return 1",
    "3",
    ...keys,
    owner,
    String(ttl),
  ]);
  if (Number(locked) !== 1) {
    const concurrent = await load(slot.bookingId, sid);
    if (concurrent) return result(concurrent);
    throw Object.assign(
      new Error(
        "This interval is reserved. Check your booking status or choose another time.",
      ),
      { status: 409 },
    );
  }
  const record = {
    bookingId: slot.bookingId,
    sid,
    start: slot.start,
    end: slot.end,
    status: "pending",
    eventId: `steve${createHash("sha256").update(`${calendarId}|${slot.bookingId}`).digest("hex")}`,
  };
  let attempted = false;
  try {
    const access = await accessToken();
    const busy = await busyRanges(
      access,
      new Date(slot.start),
      new Date(slot.end),
    );
    if (!free(Date.parse(slot.start), Date.parse(slot.end), busy))
      throw Object.assign(
        new Error("That time has become unavailable. Choose another slot."),
        { status: 409 },
      );
    await save(record); // Persist BEFORE contacting Google. Contact details are not retained here.
    const descriptionLines = [
      `20-minute ${purpose} with Sudheer Palakurla.`,
      `Attendee: ${name} (${email})`,
      phone ? `Attendee Contact: ${phone}` : "",
      notes ? `\n--- Discussion Agenda & Conversation Context ---\n${notes}` : "",
      "\nPortfolio Reference: https://sudheercv.vercel.app",
      "Meeting created automatically via Steve (Sudheer's Portfolio AI Assistant).",
    ]
      .filter(Boolean)
      .join("\n");
    const body = {
      id: record.eventId,
      summary: `${purpose}: ${name} & Sudheer Palakurla`,
      description: descriptionLines,
      start: { dateTime: slot.start, timeZone: ZONE },
      end: { dateTime: slot.end, timeZone: ZONE },
      attendees: [{ email, displayName: name }],
      visibility: "private",
      transparency: "opaque",
      extendedProperties: { private: { steveBookingId: slot.bookingId } },
      conferenceData: { createRequest: { requestId: slot.bookingId } },
    };
    attempted = true;
    const event = await google(
      `calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      access,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return await finish(record, event, access);
  } catch (error) {
    if (attempted) {
      if ([400, 401, 403, 404, 422].includes(error.status)) {
        record.status = "failed";
        record.message =
          "Google declined this booking. Contact Sudheer or select a new time after the service is restored.";
        await save(record);
      } else {
        return recoverBooking(slot.bookingId, sid);
      }
    }
    if (!attempted || record.status === "failed")
      await redis([
        "EVAL",
        "for _,k in ipairs(KEYS) do if redis.call('GET',k)==ARGV[1] then redis.call('DEL',k) end end; return 1",
        "3",
        ...keys,
        owner,
      ]);
    if (record.status === "failed") return result(record);
    throw error;
  }
}
