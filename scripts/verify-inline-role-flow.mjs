import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';

const base = 'http://127.0.0.1:5295';
const preview = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '5295',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);

try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  let sessionCalls = 0;
  let leadPayload = null;
  let chatPayload = null;

  await page.route('**/api/assistant/session', async (route) => {
    sessionCalls++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ready: true,
        contractVersion: 2,
        capabilities: {
          text: true,
          voice: true,
          booking: true,
          search: true,
        },
      }),
    });
  });

  await page.route('**/api/assistant/lead', async (route) => {
    leadPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/assistant/chat', async (route) => {
    chatPayload = route.request().postDataJSON();
    // Simulate streaming role evaluation response
    const sseBody = [
      'event: state',
      'data: {"state":"Fetching job posting"}',
      '',
      'event: state',
      'data: {"state":"Evaluated role match"}',
      '',
      'event: answer_complete',
      'data: ' + JSON.stringify({
        message: {
          id: 'role-resp-1',
          role: 'assistant',
          content: 'Sudheer is an exceptional, high-conviction fit for the Fullstack Software Engineer role at throxy [profile] [rag]. His 8+ years of production experience in TypeScript, React, Next.js, and solo architecture of real-time calling and RAG infrastructure align directly with your stack and in-house dialer mission. Would you like to schedule a 20-minute discovery call to discuss this role in detail?',
          verdict: 'Strong Match',
          verdictReasoning: 'Direct alignment across 8+ years commercial TypeScript/React/Next.js fullstack development, real-time WebRTC audio architecture, and production RAG with pgvector.',
          roleComparison: [
            {
              category: 'Documented match',
              requirement: 'TypeScript & React experience (Next.js is a big plus)',
              detail: '8+ years commercial production mastery with React, Next.js, and TypeScript across 95+ platforms.',
              evidenceIds: ['profile'],
            },
            {
              category: 'Documented match',
              requirement: 'In-house dialer & calling infrastructure',
              detail: 'Architected production real-time WebRTC Voice AI with dual-provider fallback and low-latency audio processing.',
              evidenceIds: ['voice'],
            },
            {
              category: 'Documented match',
              requirement: 'Data Engine & LLM evaluation pipelines',
              detail: 'Engineered multi-tenant RAG with PostgreSQL/pgvector and LLM guardrails in Lekhavali ERP.',
              evidenceIds: ['rag'],
            },
            {
              category: 'Documented match',
              requirement: 'Location & Visa Sponsorship',
              detail: 'London-based, 1 month notice, requires Skilled Worker sponsorship (which throxy provides).',
              evidenceIds: ['profile'],
            },
            {
              category: 'Related experience',
              requirement: 'AWS, Postgres, ClickHouse, Bun, Elixir dialer core',
              detail: 'Production PostgreSQL and AWS/OCI deployment experience; easily adopts ClickHouse and Bun.',
              evidenceIds: [],
            },
          ],
          evidence: [
            { id: 'profile', title: 'Profile', url: '/#story', source: 'Portfolio and supplied CV' },
            { id: 'rag', title: 'School ERP Assistant', url: '/#work', source: 'Production Case Study' },
            { id: 'voice', title: 'Real-time Voice AI', url: '/#work', source: 'Production Case Study' },
          ],
        },
      }),
      '',
      '',
    ].join('\n');

    return route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
      },
      body: sseBody,
    });
  });

  await page.goto(base, { waitUntil: 'domcontentloaded' });

  console.log('1. Opening Steve Assistant Panel...');
  const steveLauncher = page.locator('.steve-launcher');
  await steveLauncher.click();
  const panel = page.locator('.steve-panel');
  await expect(panel).toBeVisible();

  console.log('2. Pasting throxy JD URL into chat input...');
  const chatInput = page.locator('#steve-input');
  const userPrompt = 'https://careers.throxy.com/software-engineer-fullstack compare and let me know if he is suitable for this role?';
  await chatInput.fill(userPrompt);

  const sendBtn = page.locator('.steve-send');
  await sendBtn.click();

  console.log('3. Verifying that Steve renders the interactive inline form inside the chat...');
  const inlineCard = page.locator('.steve-inline-jd-card');
  await expect(inlineCard).toBeVisible();

  // Verify that the textarea in the inline form is pre-filled with the user's prompt!
  const jdTextarea = inlineCard.locator('textarea');
  const prefilledValue = await jdTextarea.inputValue();
  console.log('  Inline form textarea pre-filled value:', prefilledValue);
  expect(prefilledValue).toBe(userPrompt);

  // Verify that NO premature Discovery Call card is displayed yet!
  const bookingCardBeforeSubmit = page.locator('.steve-booking-inline-card');
  await expect(bookingCardBeforeSubmit).not.toBeVisible();
  console.log('  Confirmed: No premature discovery call card rendered while waiting for recruiter input.');

  // Accessibility check on inline form
  const axeResults = await new AxeBuilder({ page }).include('.steve-inline-jd-card').analyze();
  console.log('  Inline form axe violations:', axeResults.violations.length);
  if (axeResults.violations.length > 0) {
    console.log(JSON.stringify(axeResults.violations, null, 2));
  }
  expect(axeResults.violations.length).toBe(0);

  console.log('4. Filling recruiter contact details...');
  await inlineCard.locator('input[placeholder*="Sarah Jenkins"]').fill('Alex Vance');
  await inlineCard.locator('input[placeholder*="Tech Recruiter"]').fill('throxy');
  await inlineCard.locator('input[placeholder*="sarah@"]').fill('alex@throxy.com');
  await inlineCard.locator('input[placeholder*="+44"]').fill('+44 7700 900555');

  console.log('5. Submitting inline role matcher form...');
  const submitMatchBtn = inlineCard.locator('.steve-inline-jd-submit');
  await submitMatchBtn.click();

  // Verify lead was posted
  expect(leadPayload).not.toBeNull();
  expect(leadPayload.name).toBe('Alex Vance');
  expect(leadPayload.company).toBe('throxy');
  expect(leadPayload.email).toBe('alex@throxy.com');
  expect(leadPayload.phone).toBe('+44 7700 900555');
  console.log('  Confirmed: Recruiter lead posted to /api/assistant/lead:', leadPayload);

  // Wait for chat payload to arrive after async lead submission
  for (let i = 0; i < 40; i++) {
    if (chatPayload) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  // Verify chat request was sent with mode: "role"
  expect(chatPayload).not.toBeNull();
  expect(chatPayload.mode).toBe('role');
  console.log('  Confirmed: Chat endpoint called with mode: role');

  console.log('6. Verifying structured role match card and Strong Match verdict...');
  const verdictBanner = page.locator('.steve-verdict-banner');
  await expect(verdictBanner).toBeVisible();
  const verdictPill = verdictBanner.locator('.steve-verdict-pill');
  expect(await verdictPill.textContent()).toContain('STRONG MATCH');
  console.log('  Confirmed: Verdict banner shows STRONG MATCH');

  const verdictReason = verdictBanner.locator('.steve-verdict-reason');
  console.log('  Verdict Reasoning:', await verdictReason.textContent());
  expect(await verdictReason.textContent()).toContain('Direct alignment');

  const documentedMatches = page.locator('.steve-role-comparison section:has-text("Documented match")');
  await expect(documentedMatches).toBeVisible();
  expect(await documentedMatches.textContent()).toContain('TypeScript & React experience');
  expect(await documentedMatches.textContent()).toContain('In-house dialer');
  console.log('  Confirmed: Documented matches displayed with evidence tags.');

  // Now, after role match is evaluated, verify the Discovery Call card IS offered!
  const bookingCardAfterMatch = page.locator('.steve-booking-inline-card');
  await expect(bookingCardAfterMatch).toBeVisible();
  console.log('  Confirmed: 20-Minute Discovery Call card offered after evaluation.');

  expect(pageErrors.length).toBe(0);
  console.log('ALL INLINE ROLE MATCHER TESTS PASSED CLEANLY (0 errors)!');

  await browser.close();
} finally {
  preview.kill();
}
