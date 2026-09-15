import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Automated checks supplement manual assistive-technology and real-device review.
export async function checkAccessibility(page, state) {
 const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
 try {
  // This supported reading mode exposes all section content without reveal timing.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'off');
  const result = await new AxeBuilder({ page }).analyze();
  await mkdir('tmp/accessibility', { recursive: true });
  await writeFile(`tmp/accessibility/${state}.json`, JSON.stringify(result, null, 2));
  if (result.violations.length) {
   throw new Error(`Accessibility violations in ${state}: ` + JSON.stringify(result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }))));
  }
  console.log(`PASS accessibility ${state}: zero automated violations (${result.passes.length} passed rules; ${result.incomplete.length} checks need manual review).`);
 } finally {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
 }
}
