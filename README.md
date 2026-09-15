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
- src/Projects.jsx: illustrated architecture and expandable system briefs
- src/SystemDemos.jsx: interactive voice routing and edge-service illustrations
- src/QuickCV.jsx and src/Trailer.jsx: accessible dialogs
- src/scrollLock.js: shared overlay scroll locking
- src/surfaces.css: continuous background
- src/mobile.css: mobile navigation and layout
- src/geometric.css: angular framing and readability styles
- src/cinematic.css: themed scrollbars and final motion styles
- public/: original portrait and downloadable CV

Earlier styling files remain in the cascade; geometric.css is the final override. EnergyCore.jsx is an unused earlier animation.

Contact uses email and LinkedIn. Fonts load remotely with local fallbacks. No analytics or contact backend is included. See REVIEW.md for the latest subjective review and browser verification.

The GitHub Actions workflow validates builds. Automatic Vercel deployment requires the repository connection in Vercel Settings → Git; the CLI connection attempt returned a server error, so this connection must be completed before pushes can be expected to deploy automatically.



