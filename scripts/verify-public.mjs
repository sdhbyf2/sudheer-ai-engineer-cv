import {chromium,expect} from '@playwright/test';
const base=process.env.CV_TEST_URL||'http://127.0.0.1:5288';
const executablePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({executablePath,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const response=await page.goto(base,{waitUntil:'networkidle'});
 expect(response.status()).toBe(200);expect(new URL(page.url()).origin).toBe(new URL(base).origin);
 const html=await response.text();expect(html).toContain('Thoughtful by nature.');expect(html).toContain('school management ERP');
 await expect(page.locator('.frame-canvas canvas')).toBeVisible({timeout:20000});
 await expect(page.locator('h1')).toHaveCount(1);
 expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://cv-one-khaki.vercel.app/');
 expect(await page.locator('.angular-photo img').evaluate(el=>el.currentSrc)).toContain('.webp');
 await page.getByRole('button',{name:'Quick CV',exact:true}).click();await expect(page.locator('.quick-cv')).toBeVisible();await page.keyboard.press('Escape');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open navigation'}).click();await page.locator('header nav a[href="#work"]').click();await page.waitForTimeout(1400);
 await page.getByRole('button',{name:'Preview fallback'}).click();await expect(page.locator('.interactive-voice')).toHaveAttribute('data-fallback','true');
 for(const path of ['/robots.txt','/sitemap.xml','/llms.txt','/portrait-480.webp']){const r=await page.request.get(base+path);expect(r.status()).toBe(200);}
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const nojs=await context.newPage();await nojs.goto(base);await expect(nojs.locator('#story h2')).toBeVisible();expect((await nojs.locator('body').innerText()).length).toBeGreaterThan(2000);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('html')).toHaveAttribute('data-motion','off');
 expect(errors).toEqual([]);console.log('PASS: public access, prerendered HTML, hydration, SEO files, WebP, 4 widths, dialogs, navigation, voice interaction, no-JS CV, reduced motion; no browser errors.');
}finally{await browser.close();}
