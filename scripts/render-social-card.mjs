import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Render the editable HTML layout with the original portrait; no generated likeness.
const routes = {
 '/': ['scripts/social-card.html', 'text/html'],
 '/fonts/dm-sans-latin.woff2': ['public/fonts/dm-sans-latin.woff2', 'font/woff2'],
 '/portrait-960.webp': ['public/portrait-960.webp', 'image/webp'],
};
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) });
try {
 const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
 await page.route('https://portfolio-preview.test/**', async route => {
  const asset = routes[new URL(route.request().url()).pathname];
  if (!asset) return route.fulfill({ status: 404 });
  await route.fulfill({ contentType: asset[1], body: await readFile(asset[0]) });
 });
 await page.goto('https://portfolio-preview.test/', { waitUntil: 'networkidle' });
 await page.evaluate(() => document.fonts.ready);
 await page.screenshot({ path: 'public/social-card.png' });
 console.log('Rendered public/social-card.png (1200 × 630).');
} finally { await browser.close(); }
