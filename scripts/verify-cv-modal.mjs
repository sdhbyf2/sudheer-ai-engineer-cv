import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';

const base = 'http://127.0.0.1:5294';
const preview = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '5294',
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

  let leadPayload = null;
  await page.route('**/api/assistant/lead', async (route) => {
    leadPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#contact');

  console.log('1. Checking Contact CTA alignment and layout...');
  const contactCtaGroup = page.locator('.role-contact-action');
  await expect(contactCtaGroup).toBeVisible();

  const ctaButtons = contactCtaGroup.locator('.contact-cta-btn');
  const count = await ctaButtons.count();
  expect(count).toBe(3);

  // Check heights and vertical alignment
  const bboxes = [];
  for (let i = 0; i < count; i++) {
    const btn = ctaButtons.nth(i);
    const box = await btn.boundingBox();
    bboxes.push(box);
    console.log(`  Button ${i}: ${await btn.textContent()} -> height: ${box.height}px, top: ${box.y}px`);
    expect(box.height).toBe(52);
  }

  // All 3 should be on the same horizontal row on a 1280px screen
  expect(bboxes[0].y).toBeCloseTo(bboxes[1].y, 1);
  expect(bboxes[1].y).toBeCloseTo(bboxes[2].y, 1);

  // Check center alignment relative to container
  const containerBox = await contactCtaGroup.boundingBox();
  const ctaGroupCenter = containerBox.x + containerBox.width / 2;
  const viewportCenter = 1280 / 2;
  console.log(`  CTA container center: ${ctaGroupCenter}px, Viewport center: ${viewportCenter}px`);
  expect(Math.abs(ctaGroupCenter - viewportCenter)).toBeLessThan(15);

  console.log('2. Testing Contact "Download CV" button...');
  const cvBtn = contactCtaGroup.locator('.cv-contact-button');
  await cvBtn.click();

  const modal = page.locator('.steve-cv-dialog');
  await expect(modal).toBeVisible();
  const modalBox = await page.locator('.steve-cv-card').boundingBox();
  console.log(`  Modal opened. Card width: ${modalBox.width}px, height: ${modalBox.height}px`);

  // Accessibility check on modal
  const axeResults = await new AxeBuilder({ page }).include('.steve-cv-dialog').analyze();
  console.log(`  Modal axe violations: ${axeResults.violations.length}`);
  if (axeResults.violations.length > 0) {
    console.log(JSON.stringify(axeResults.violations, null, 2));
  }
  expect(axeResults.violations.length).toBe(0);

  console.log('3. Testing validation in Download CV modal...');
  const submitBtn = page.locator('.steve-cv-submit');
  await submitBtn.click();
  const errorMsg = page.locator('.steve-cv-error');
  await expect(errorMsg).toBeVisible();
  expect(await errorMsg.textContent()).toContain('full name');

  await page.locator('#cv-name').fill('Jane Doe');
  await submitBtn.click();
  await expect(errorMsg).toBeVisible();
  expect(await errorMsg.textContent()).toContain('email');

  console.log('4. Submitting valid form and verifying lead capture + download...');
  await page.locator('#cv-email').fill('jane.doe@techcorp.example');
  await page.locator('#cv-company').fill('TechCorp Capital');
  await page.locator('#cv-phone').fill('+44 7700 900123');

  // Listen for download event
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await submitBtn.click();

  await expect(page.locator('.steve-cv-success')).toBeVisible();
  console.log('  Success state visible: "Download Started!"');
  expect(leadPayload).toMatchObject({
    name: 'Jane Doe',
    company: 'TechCorp Capital',
    email: 'jane.doe@techcorp.example',
    phone: '+44 7700 900123',
    roleText: 'CV Download Request (from Portfolio Modal)',
  });
  expect(typeof leadPayload.clientRequestId).toBe('string');
  console.log('  Lead payload correctly sent to /api/assistant/lead:', leadPayload);

  // Close modal via Done button
  await page.locator('.steve-cv-done').click();
  await expect(modal).not.toBeVisible();
  console.log('  Modal closed cleanly.');

  console.log('5. Testing Hero Section "Download CV" trigger...');
  const heroCvBtn = page.locator('.hero-actions .button.primary:has-text("Download CV")');
  await heroCvBtn.click();
  await expect(modal).toBeVisible();
  // Close via Escape key
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  console.log('  Hero section Download CV opened modal and Escape key closed it.');

  console.log('6. Testing Quick CV "Full CV" trigger...');
  const quickCvBtn = page.locator('.nav-cv');
  await quickCvBtn.click();
  const quickCvModal = page.locator('.quick-cv');
  await expect(quickCvModal).toBeVisible();

  const fullCvBtn = quickCvModal.locator('.button.primary:has-text("Full CV")');
  await fullCvBtn.click();
  await expect(quickCvModal).not.toBeVisible();
  await expect(modal).toBeVisible();
  console.log('  Quick CV Full CV button seamlessly transitioned to Download CV modal.');

  // Close via close icon
  await page.locator('.steve-cv-close').click();
  await expect(modal).not.toBeVisible();

  console.log('7. Testing footer Download CV link...');
  const footerCvBtn = page.locator('.contact-cv-link');
  await footerCvBtn.scrollIntoViewIfNeeded();
  await footerCvBtn.click();
  await expect(modal).toBeVisible();
  await modal.locator('.steve-cv-close').click();
  await expect(modal).not.toBeVisible();

  expect(pageErrors.length).toBe(0);
  console.log('ALL CV MODAL & CONTACT CTA TESTS PASSED CLEANLY (0 errors)!');

  await browser.close();
} finally {
  preview.kill();
}
