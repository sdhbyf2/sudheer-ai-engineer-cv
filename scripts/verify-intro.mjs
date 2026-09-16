import { expect } from '@playwright/test';
import { checkAccessibility } from './accessibility.mjs';

export async function verifyIntro(page, engine) {
 const trigger = page.getByRole('button', { name: /Watch the introduction/ });
 const film = page.locator('.intro-film');
 await expect(trigger).toContainText('30 SEC');
 await trigger.click();
 await expect(film).toHaveAttribute('data-playing', 'true');
 await expect(film.locator('.intro-time')).toContainText('/ 00:30');
 await page.getByRole('button', { name: 'Pause introduction', exact: true }).click();
 const paused = await film.locator('.intro-time').textContent();
 await page.waitForTimeout(350);
 expect(await film.locator('.intro-time').textContent()).toBe(paused);
 for (const [width, height] of [[1440,1000],[390,844],[320,568],[768,1024],[844,390]]) {
  await page.setViewportSize({ width, height });
  for (let scene = 0; scene < 4; scene++) {
   await page.getByRole('button', { name: new RegExp(`Go to scene ${scene + 1}:`) }).click();
   await expect(film).toHaveAttribute('data-scene', String(scene));
   await expect(film).toHaveAttribute('data-playing', 'false');
   const bounds = await film.evaluate(el => {
    const body = el.querySelector('.intro-body').getBoundingClientRect();
    const top = el.querySelector('.intro-top').getBoundingClientRect();
    const bottom = el.querySelector('.intro-bottom').getBoundingClientRect();
    return { horizontal: el.scrollWidth <= el.clientWidth + 1, overlap: body.top < top.bottom - 1 || body.bottom > bottom.top + 1, bottom: bottom.bottom, height: innerHeight };
   });
   expect(bounds.horizontal, `${width}x${height}, scene ${scene}: horizontal overflow`).toBe(true);
   expect(bounds.overlap, `${width}x${height}, scene ${scene}: content/control overlap`).toBe(false);
   expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
   if (engine === 'chromium' && width === 1440) await checkAccessibility(page, `intro-scene-${scene}`);
   if (engine === 'chromium' && [1440,320,844].includes(width)) await film.screenshot({ path: `tmp/browser-review/intro-${width}-scene-${scene}.png` });
  }
 }
 await page.keyboard.press('Home');
 await expect(film).toHaveAttribute('data-scene', '0');
 await page.keyboard.press('ArrowRight');
 await expect(film).toHaveAttribute('data-scene', '1');
 await page.keyboard.press('End');
 await expect(film).toHaveAttribute('data-scene', '3');
 await page.getByRole('button', { name: 'Explore my work', exact: true }).click();
 await expect(film).toHaveCount(0);
 await expect(page.locator('#work')).toBeFocused();
 await expect(page).toHaveURL(/#work$/);
 await trigger.click();
 await page.getByRole('button', { name: /Go to scene 4:/ }).click();
 await page.getByRole('button', { name: 'Discuss a role', exact: true }).click();
 await expect(page.locator('#contact')).toBeFocused();
 await expect(page).toHaveURL(/#contact$/);
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
 await trigger.click();
 await expect(film).toHaveAttribute('data-playing', 'false');
 await page.keyboard.press('Escape');
 await expect(trigger).toBeFocused();
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
 await page.setViewportSize({ width: 1440, height: 1000 });
 if (engine === 'chromium') {
  await trigger.click();
  // Exercise the real 30-second playback rather than a test-only animation clock.
  for (const scene of ['1','2','3']) await expect(film).toHaveAttribute('data-scene', scene, { timeout: 12000 });
  await expect(film).toHaveAttribute('data-complete', 'true', { timeout: 10000 });
  await expect(film.locator('.intro-time')).toHaveText('00:30 / 00:30');
  await expect(film).toHaveAttribute('data-playing', 'false');
  await page.getByRole('button', { name: 'Replay introduction', exact: true }).click();
  await expect(film).toHaveAttribute('data-scene', '0');
  await expect(film).toHaveAttribute('data-playing', 'true');
  await page.keyboard.press('Escape');
 }
 console.log(`PASS ${engine} introduction: 30-second label, all chapters at 5 viewports, pause, keyboard controls, both destination buttons, focus and reduced motion.`);
}
