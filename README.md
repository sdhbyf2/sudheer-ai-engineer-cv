# Cinematic CV portfolio

React, Vite, Three.js and Lenis portfolio for Sudheer Palakurla. All source, assets, builds and verification artifacts are contained in this cv folder.

## Run

```sh
npm install
npm run dev
npm run build
npm run preview -- --host 127.0.0.1 --port 5288 --strictPort
```

Use http://127.0.0.1:5288 for the production preview. Deploy dist to a static host.

Public site: https://sudheercv.vercel.app/

`npm run build` generates responsive WebP portraits, bundles the application, and renders the complete React portfolio into `dist/index.html`. Visitors receive the CV content before JavaScript loads; React then enables the interactive features. The original PNG and PDF are preserved.

Vercel configuration lives in `vercel.json`. Deploy the repository root with `npm run build` and output directory `dist`. `.vercelignore` excludes temporary review artifacts and dependencies from uploads. Local Vercel credentials and project metadata must remain untracked.

Canonical, Open Graph, Twitter and Person/ProfilePage structured metadata use the public site URL. `public/robots.txt`, `public/sitemap.xml` and `public/llms.txt` point to the same site. If the domain changes, update all these references together. Hash-based sections are parts of one page and are not separate sitemap URLs.

For browser verification, run `node scripts/verify-public.mjs`. Set `CV_TEST_URL` to test production and `CHROME_PATH` if Chrome is installed elsewhere. This checks public access, prerendered content, hydration, responsive images, key interactions and the no-JavaScript reading experience.

## Current design

A continuous charcoal background, editorial typography, an asymmetrical portrait frame and markers travelling along the frame lines. The original photo is preserved; its crop is controlled in CSS with a relaxed 103% image scale. There is no glowing portrait halo.

Scroll drives portrait movement and section-title offsets. Sections reveal on entry and remain visible; decorative animations pause outside the viewport. Animation runs by default and respects system reduced-motion preferences. The header offers direct Quick CV access. Dialogs and mobile navigation manage keyboard focus and shared scroll locking.

The full name appears once on the main page, and remains in the standalone CV and introduction where useful. Body copy, dates, technology tags and supporting labels have been enlarged for readability.

## Source map

- src/career.js: shared career content
- src/main.jsx: client startup and hydration
- src/App.jsx: page and navigation
- src/Portrait.jsx and src/TechnicalFrame.jsx: photo and active Three.js pattern
- src/Projects.jsx: illustrated architecture and expandable case studies with project-specific contact links
- src/SystemDemos.jsx: interactive voice routing and edge-service illustrations
- src/WebWork.jsx: owner-confirmed website and internal application contributions, with two real website previews
- src/QuickCV.jsx and src/Trailer.jsx: accessible dialogs
- src/scrollLock.js: shared overlay scroll locking
- src/surfaces.css: continuous background
- src/mobile.css: mobile navigation and layout
- src/geometric.css: angular framing and readability styles
- src/cinematic.css: themed scrollbars and final motion styles
- public/: original portrait and downloadable CV

Earlier styling files remain in the cascade; cinematic.css is the final override. EnergyCore.jsx is an unused earlier animation.

Contact uses email and LinkedIn. Fonts are self-hosted WOFF2 with local fallbacks; the main DM Sans font is preloaded. No analytics or contact backend is included. See REVIEW.md for the latest subjective review and browser verification.

The GitHub Actions workflow validates builds. Vercel is connected to `sdhbyf2/sudheer-ai-engineer-cv`, with `main` configured as the production branch. Pushes to `main` trigger production deployments to https://sudheercv.vercel.app/. The public portfolio does not require Vercel authentication.

## Browser verification

`node scripts/verify-browsers.mjs` starts a production preview and checks Chromium, Firefox and WebKit at five viewport widths. It covers case studies, project email subjects, navigation offsets, dialog focus restoration, the PDF, reduced motion and reading without JavaScript. Screenshots are saved under `tmp/browser-review/` and are not committed. Build first with `npm run build`.

Install matching Playwright browser versions before running. To keep generated files inside this folder on Windows:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'tmp\browsers'
npx playwright install firefox webkit
node scripts/verify-browsers.mjs
```

Windows uses installed Google Chrome by default; set `CHROME_PATH` to override. On Linux, install Chromium too (`npx playwright install --with-deps chromium firefox webkit`). `CV_TEST_BROWSERS` accepts a comma-separated engine list. Set `CV_TEST_URL` to check a live deployment. WebKit coverage is engine testing, not a claim of testing Safari on a physical iPhone.

## Search Console

The sitemap and crawlable HTML are already public. To verify the URL-prefix property `https://sudheercv.vercel.app/`, obtain the HTML verification tag from Google Search Console. Set the tag's **content value only** as `GOOGLE_SITE_VERIFICATION` in the Vercel project's Production environment and redeploy. The prerender step safely inserts the tag in the initial HTML head; when the variable is absent, no placeholder is published.

Once deployed, finish **Verify** in Search Console, then submit `https://sudheercv.vercel.app/sitemap.xml`. Keep the variable configured for subsequent deployments. This setup does not itself verify ownership or submit the sitemap.

Google's instructions: [ownership verification](https://support.google.com/webmasters/answer/9008080?hl=en) and [sitemap submission](https://support.google.com/webmasters/answer/7451001?hl=en).

Project case studies describe the supplied experience without invented measurements. Two public website previews are included, and contribution labels reflect the owner's clarification. Lekhavali remains marked as work in progress. The three AI architecture illustrations are separate from these website previews. See `RECRUITER_REVIEW.md` for the remaining human and physical-device checks.

## Sharing assets and fonts

The Open Graph and Twitter preview uses `public/social-card.png` (1200 × 630). Its editable layout is `scripts/social-card.html`; run `node scripts/render-social-card.mjs` to render it with the original portrait and local typography. Rendering uses Playwright/Chrome and is a manual asset task, not part of Vercel's build.

`node scripts/capture-work.mjs` captures the two public website homepages into `public/work/` as WebP. Always visually review refreshed screenshots before publishing. Their source information and asset-rights note are in `public/work/README.md`.

`node scripts/vendor-fonts.mjs` refreshes the checked-in Latin WOFF2 subsets and `src/fonts.css`. Normal builds do not download fonts. The individual font licenses are included under `public/fonts/`.

Skills in `src/career.js` have four visible essentials and expandable additional expertise. The additions were checked against the original CV; no unsupported skill ratings or certifications are implied.



