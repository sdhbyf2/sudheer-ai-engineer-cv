import { chromium, firefox, webkit, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { checkAccessibility } from './accessibility.mjs';
import { verifyIntro } from './verify-intro.mjs';
import { verifyProjectLinks } from './verify-project-links.mjs';

const base = process.env.CV_TEST_URL || 'http://127.0.0.1:5291';
const preview = process.env.CV_TEST_URL ? null : spawn(process.execPath,
 ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '5291', '--strictPort'], { stdio: 'pipe' });
let previewError = '';
preview?.stderr.on('data', data => { previewError += data; });
const engines = { chromium, firefox, webkit };
await mkdir('tmp/browser-review', { recursive: true });
try {
 if (preview) {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
   if (preview.exitCode !== null) throw new Error('Preview exited: ' + previewError);
   try { ready = (await fetch(base)).ok; } catch { /* Wait for the preview server. */ }
   if (ready) break;
   await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Preview did not start: ' + previewError);
 }
 for (const name of (process.env.CV_TEST_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  const executablePath = name === 'chromium' ? process.env.CHROME_PATH ||
   (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) : undefined;
  const browser = await engines[name].launch({ headless: true, executablePath });
  try {
   const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
   const page = await context.newPage();
   const errors = [];
   const externalFonts = [];
   page.on('pageerror', error => errors.push(error.message));
   page.on('request', request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url()); });
   const response = await page.goto(base, { waitUntil: 'networkidle' });
   expect(response.status()).toBe(200);
   expect(await response.text()).toContain('Engineering decisions');
   await expect(page.locator('h1')).toHaveCount(1);
   await expect(page.locator('.hero .button.primary')).toHaveText('Download CV');
   await expect(page.locator('.hero-hiring-facts')).toContainText('London / 1 month notice / Sponsorship required');
   await expect(page.locator('.hero a[href="#experience"]')).toHaveText('View experience');
   await expect(page.locator('#story .recruiter-details')).toContainText('London, United Kingdom');
   await expect(page.locator('#story .recruiter-details')).toContainText('1 month');
   await expect(page.locator('#story .recruiter-details')).toContainText('Skilled Worker visa');
   await expect(page.locator('body')).not.toContainText('2029');
   await expect(page.locator('#story .story-copy')).toContainText('began in frontend');
   await expect(page.locator('#story .story-copy')).toContainText('teams delivering hundreds of websites');
   await expect(page.locator('.delivery-path li')).toHaveCount(4);
   await expect(page.locator('.delivery-path')).toContainText('Jenkins');
   await expect(page.locator('.delivery-path')).toContainText('VPS');
   await expect(page.locator('#story .recruiter-details')).toContainText('Employer sponsorship required for a new full-time position.');
   await expect(page.locator('body')).not.toContainText(/B2B|umbrella|contract roles/i);
   expect(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(['home','story','experience','work','capabilities','contact']);
   await expect(page.locator('#experience .role').first()).toContainText('Web Designer');
   await expect(page.locator('#experience .role').first()).toContainText('AI & application engineering responsibilities');
   const hiringLink = page.locator('#contact .role-contact-action a');
   expect(new URL(await hiringLink.getAttribute('href')).searchParams.get('subject')).toBe('Engineering opportunity');
   await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
   expect(await page.locator('.angular-photo img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
   await page.screenshot({ path: `tmp/browser-review/${name}-desktop.png` });
   if (name === 'chromium') await checkAccessibility(page, 'desktop');

   const quickCV = page.getByRole('button', { name: 'Quick CV', exact: true });
   await quickCV.click();
   await expect(page.locator('.quick-cv')).toBeVisible();
   await expect(page.locator('.quick-cv .recruiter-details')).toContainText('Full-time engineering roles');
   if (name === 'chromium') await checkAccessibility(page, 'quick-cv');
   await page.keyboard.press('Escape');
   await expect(page.locator('.quick-cv')).not.toBeVisible();
   await expect(quickCV).toBeFocused();
   const introduction = page.getByRole('button', { name: /Watch the introduction/ });
   await introduction.click();
   await expect(page.locator('.trailer')).toBeVisible();
   await page.keyboard.press('Escape');
   await expect(introduction).toBeFocused();
   await verifyIntro(page, name);

   for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   }
   await page.setViewportSize({ width: 390, height: 844 });
   if (name === 'chromium') await checkAccessibility(page, 'mobile');
   const mobileCV = page.getByRole('button', { name: 'Open quick CV', exact: true });
   await mobileCV.click();
   await expect(page.locator('.quick-cv')).toBeVisible();
   await page.keyboard.press('Escape');
   await expect(mobileCV).toBeFocused();
   await page.getByRole('button', { name: 'Open navigation' }).click();
   if (name === 'chromium') await checkAccessibility(page, 'mobile-menu');
   await page.locator('header nav a[href="#work"]').click();
   await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
   await expect.poll(() => page.evaluate(() => {
    const section = document.querySelector('#work');
    return Math.round(section.getBoundingClientRect().top + parseFloat(getComputedStyle(section).paddingTop)
     - document.querySelector('header').getBoundingClientRect().bottom);
   })).toBeGreaterThanOrEqual(15);
   await expect.poll(() => page.evaluate(() => {
    const section = document.querySelector('#work');
    return Math.round(section.getBoundingClientRect().top + parseFloat(getComputedStyle(section).paddingTop)
     - document.querySelector('header').getBoundingClientRect().bottom);
   })).toBeLessThan(35);
   await verifyProjectLinks(page, name, base);

   for (const card of await page.locator('.project').all()) {
    const toggle = card.getByRole('button', { name: /^Read case study:/ });
    await toggle.click();
    await expect(card.locator('.project-detail')).toBeVisible();
    await expect(card.locator('.case-decisions li')).toHaveCount(2);
    if (name === 'chromium') await checkAccessibility(page, 'case-study-' + await card.getAttribute('class').then(value => value.match(/project-\d+/)[0]));
    const link = card.getByRole('link', { name: /^Discuss this project:/ });
    const href = new URL(await link.getAttribute('href'));
    expect(href.protocol).toBe('mailto:');
    expect(href.searchParams.get('subject')).toContain('Let’s discuss:');
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.screenshot({ path: `tmp/browser-review/${name}-${await card.getAttribute('class').then(c => c.match(/project-\d+/)[0])}.png` });
    await card.getByRole('button', { name: /^Close case study:/ }).click();
   }
   await page.getByRole('button', { name: 'Preview fallback' }).click();
   await expect(page.locator('.interactive-voice')).toHaveAttribute('data-fallback', 'true');
   await page.locator('.edge-services button').filter({ hasText: 'R2' }).click();
   await expect(page.locator('.interactive-edge .demo-explanation')).toContainText('Object storage');
   const collection = page.locator('.work-collection');
   await expect(collection).not.toHaveAttribute('open', '');
   await collection.locator('summary').focus();
   await page.keyboard.press('Enter');
   await expect(collection).toHaveAttribute('open', '');
   await expect(collection.locator('.web-work-links li')).toHaveCount(11);
   if (name === 'chromium') await checkAccessibility(page, 'additional-projects');
   await expect(page.locator('.web-work-links a[href="https://lekhavali.com/"]')).toContainText('Work in progress');
   await expect(page.locator('.web-work-links li').filter({ hasText: '3 Bolt Court' })).toContainText('Team contribution');
   await expect(page.locator('.web-work-links a[href="https://crazytechsol.com/"]')).toContainText('Complete website and voice assistant');
   await page.locator('.web-work').scrollIntoViewIfNeeded();
   await expect(page.locator('.web-work img')).toHaveCount(0);
   await page.locator('.web-work').screenshot({ path: `tmp/browser-review/${name}-websites-mobile.png` });
   await collection.locator('summary').focus();
   await page.keyboard.press('Enter');
   await expect(collection).not.toHaveAttribute('open', '');
   for (const detail of await page.locator('.skill-details').all()) {
    await detail.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(detail).toHaveAttribute('open', '');
    await expect(detail.locator('li').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Enter');
    await expect(detail).not.toHaveAttribute('open', '');
   }
   expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://sudheercv.vercel.app/social-card.png');
   const social = await page.request.get(new URL('/social-card.png', base).href);
   expect(social.status()).toBe(200);
   expect(social.headers()['content-type']).toContain('image/png');
   expect(externalFonts).toEqual([]);
   const pdf = await page.request.get(new URL('/Sudheer_Palakurla_AI_Engineer_CV.pdf', base).href);
   expect(pdf.status()).toBe(200);
   expect(pdf.headers()['content-type']).toContain('application/pdf');
   await page.emulateMedia({ reducedMotion: 'reduce' });
   await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
   await page.setViewportSize({ width: 320, height: 700 });
   await page.locator('#contact').scrollIntoViewIfNeeded();
   await expect(page.getByRole('link', { name: 'Portfolio source' })).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   await page.screenshot({ path: `tmp/browser-review/${name}-contact-mobile.png` });
   expect(errors).toEqual([]);

   const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
   const reader = await nojs.newPage();
   await reader.goto(base);
   await expect(reader.locator('.case-decisions').first()).toBeVisible();
   await expect(reader.getByRole('link', { name: /^Discuss this project:/ })).toHaveCount(3);
   await nojs.close();
   console.log(`PASS ${name}: 5 widths, portrait, dialog focus, menu alignment, case studies, text-only web work, contribution labels, keyboard skill expansion, local fonts, social card, contact, diagrams, PDF, reduced motion, no-JS reading, no runtime errors.`);
  } finally { await browser.close(); }
 }
} finally { preview?.kill(); }
