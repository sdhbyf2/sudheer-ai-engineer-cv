// Run manually when updating fonts. Production builds use the checked-in files.
import { mkdir, writeFile } from 'node:fs/promises';

const source = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Barlow+Condensed:wght@500;600;700;800&display=swap';
const response = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error('Font CSS download failed');
const blocks = [...(await response.text()).matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(match => match[1]);
if (blocks.length !== 5) throw new Error('Unexpected font subset response');
await mkdir('public/fonts', { recursive: true });
const styles = [];
for (const block of blocks) {
 const family = block.match(/font-family: '([^']+)'/)[1];
 const weight = block.match(/font-weight: ([^;]+)/)[1];
 const url = block.match(/src: url\(([^)]+)\)/)[1];
 if (new URL(url).hostname !== 'fonts.gstatic.com' || !url.endsWith('.woff2')) throw new Error('Unexpected font source');
 const filename = family === 'DM Sans' ? 'dm-sans-latin.woff2' : `barlow-condensed-${weight}-latin.woff2`;
 const font = await fetch(url);
 if (!font.ok) throw new Error('Font download failed: ' + filename);
 const bytes = Buffer.from(await font.arrayBuffer());
 if (bytes.subarray(0, 4).toString() !== 'wOF2') throw new Error('Invalid WOFF2: ' + filename);
 await writeFile('public/fonts/' + filename, bytes);
 styles.push(block.replace(url, '/fonts/' + filename));
 console.log(`${filename}: ${Math.round(bytes.length / 1024)} KB`);
}
for (const family of ['dmsans', 'barlowcondensed']) {
 const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
 if (!license.ok) throw new Error('License download failed');
 await writeFile(`public/fonts/${family}-OFL.txt`, await license.text());
}
await writeFile('src/fonts.css', '/* Self-hosted Latin subsets. See public/fonts/ for SIL Open Font Licenses. */\n' + styles.join('\n'));
