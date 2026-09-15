import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/work', { recursive: true });
await mkdir('tmp/work-captures', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined) });
try {
 for (const [name, url] of [['crazy-techsol', 'https://crazytechsol.com/'], ['pain-divine', 'https://paindivine.co.uk/']]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 1 });
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  if (!response.ok()) throw new Error(`Website returned ${response.status()}: ${url}`);
  await page.evaluate(() => document.fonts.ready);
  console.log(JSON.stringify({ url, title: await page.title(), text: (await page.locator('body').innerText()).slice(0, 900) }));
  await page.screenshot({ path: `tmp/work-captures/${name}.png`, animations: 'disabled' });
  await sharp(`tmp/work-captures/${name}.png`).webp({ quality: 85 }).toFile(`public/work/${name}.webp`);
  await page.close();
 }
} finally { await browser.close(); }
