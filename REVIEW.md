# Current website review

Reviewed 14 September 2026. These are subjective design assessments, not Lighthouse scores, recruiter-study results or world rankings. This review supersedes earlier evaluations of the circular glowing design.

| Area | Before this readability pass | After |
| --- | --- | --- |
| Overall design | 8.5/10 | 9.0/10 |
| Readability | 7.5/10 | 9.0/10 |
| Portrait and pattern balance | 8.5/10 | 9.0/10 |
| Responsive layout and interaction | 8.5/10 | 9.0/10 |

## Improvements delivered

- Replaced the glowing circle with an asymmetric cut-corner portrait, fine polygon outlines and moving dots. Increased dot size and opacity in the latest pass, without adding glow.
- Kept the relaxed portrait crop and continuous charcoal background.
- Restored scroll-driven portrait and heading movement, plus section reveals that replay on entry.
- Removed repeated full names from the main page. Standalone dialogs retain identification.
- Increased reading text to 16–17px, dates and tags to 13px, and most small supporting labels to 11–12px. Architecture diagram labels use 10px to fit narrow screens.
- Improved mobile navigation, direct CV access, touch targets, dialog scrolling, focus management and safe-area spacing.

## Verification

Production build passed. Automated Chrome checks passed at 320x568, 360x740, 390x844, 430x932, 768x1024, 844x390, 1024x768 and 1440x1000. No horizontal overflow or browser errors were observed.

Verified portrait image loading, angular crop, centered alignment, primary touch targets, menu focus trapping, inert background, menu-to-CV scroll locking, dialog internal scrolling and focus restoration, scroll-driven motion, pause controls, reduced motion, interactive RAG steps, expandable project briefs, landscape trailer and identical full-width section backgrounds.

Visually inspected final desktop hero, mobile hero and expanded mobile project screenshots. Reproducible browser checks: tmp/check-mobile-geometric.mjs. Screenshots: tmp/desktop-geometric.png, tmp/mobile-geometric-hero.png and tmp/mobile-geometric-project.png.

Mobile validation used browser emulation, not physical devices. A stronger future portfolio could include approved real product screenshots, public demos and independently verified project outcomes. The present architecture artwork is illustrative, and career claims remain grounded in the supplied CV.

## Line-motion refinement

Removed the background dot grid following user feedback. The top marker remains; two additional crisp markers follow the outer polygon and a short travelling accent follows the inner border. Markers share the exact frame geometry and drift, so they stay on their tracks while scrolling. No halo or glowing trail is used. Existing pause, reduced-motion and offscreen rendering controls remain in effect.

## Content and navigation refinement

Subjective overall design score: 9.0 to 9.1/10. Removed education dates from the website and Quick CV, enlarged The foundation to 16px, and moved career-impact highlights beneath the profile heading to use the empty column space. Removed decorative numbering from section labels, skills, portrait, project artwork and motion controls. Architecture step names now stand on their own and the card contents are centered.

Renamed the independent project to School SaaS ERP using the user's clarification, retaining its documented RAG and voice capabilities. Consolidated anchor navigation into one destination calculation: section content lands 24px below the fixed header, including mobile menu transitions and motion-off navigation.

Production build and the eight-viewport interaction suite passed. Additional checks in tmp/check-editorial.mjs verify education-date removal, foundation font size, school ERP title, card alignment and desktop/mobile menu positioning. Final visual review also corrected spacing between impact percentages and their descriptions.

## Automatic cinematic motion

Removed the recruiter-facing editorial note from Quick CV and removed both page-level motion controls. Motion is enabled by default, ignoring old local pause preferences, while system reduced-motion preferences remain respected. Added themed dark/gold scrollbars, staged typography, section and project border reveals, animated vector tiles, timeline scroll progress, menu entrances and fine-pointer link interactions. The project headline is restored to Conversation without interruption.; its description retains the school SaaS ERP context.

Validation: final production build passed. Mobile interaction and editorial-navigation suites passed. The cinematic check passed automatic motion with a stale saved pause setting, removed controls and CV note, scrollbar colors, vector animation, timeline progression, 320–1920px viewport checks, and system reduced motion with no browser errors. Desktop and mobile screenshots were visually reviewed. Browser viewport checks do not claim physical testing on every device.

## Project clarity and interaction polish

Subjective design score: 9.1 to 9.2/10. Updated the RAG project to school management ERP throughout its subtitle, description and interactive input explanation. Removed its consultancy/production-platform attribution and omitted the empty context element. The separate voice project now uses VOICE AI and Voice AI for its label and context; school references were removed from that column. Its Conversation without interruption. headline remains.

Added short entrance transitions to RAG explanation changes and expanded system briefs, with staggered edge-service labels. These interactions inherit the system reduced-motion override. Production build passed; targeted browser checks passed copy corrections, attribution removal, step-text readability, no horizontal overflow at 320/390/768/1440 widths and reduced motion. The final RAG project screenshot was visually inspected.

## Recruiter experience polish

Latest subjective design/interaction score: 9.2 to 9.5/10. This is an editorial assessment, not a measured performance score or a world ranking. A 9.9 claim is not supported by the current browser checks alone; real-device review, recruiter feedback and actual product demonstrations would provide stronger evidence.

Improvements:
- Voice architecture now includes a clearly labeled routing illustration with preview/reset controls and contextual explanation. It does not connect to a live voice API.
- Edge services can be selected by touch or keyboard to explain their responsibilities.
- Secondary section labels are more legible, and current navigation links receive an active state.
- Section deep links and browser Back/Forward use the same fixed-header alignment as menu navigation.
- Project expansion buttons have unique accessible names.
- Revealed content stays visible on subsequent scrolling; in-view state separately pauses offscreen decorative animation.

Verification: production build passed. New browser checks cover direct links, history navigation, selected menu state, voice routing preview/reset, edge selection with keyboard, eight widths from 320 to 1920px, 44px touch targets, reduced motion and the original PDF download. Final mobile menu/dialog and portrait regression checks also run in tmp/check-mobile-geometric.mjs. Screenshots are in tmp/polish-voice-*.png and tmp/polish-edge-*.png.

## Case studies, public work and browser coverage — 15 September 2026

Subjective design/usability score: **9.5 → 9.6/10**. The improvement comes from clearer engineering decisions, accessible project contact links, public website examples and a WebKit focus correction. This is not a Lighthouse score, a hiring assessment or a world ranking.

- Three expandable case studies now explain the challenge, two engineering decisions and delivered capability. No new performance figures or unverified business results were added.
- Each case study offers an email link with the relevant project in its subject. The contact section links to this portfolio's public source repository.
- Added eight website URLs supplied by the owner in a separate selected-websites section. GetMyHotels uses its working HTTPS destination. Sanguine's supplied HTTP page responds successfully; its HTTPS endpoint has a certificate-name mismatch, so the original HTTP URL remains explicitly marked.
- Chrome, Firefox and WebKit passed at widths 320, 390, 768, 1024 and 1440. Checks cover portrait loading, horizontal overflow, navigation offsets, dialog closing/focus restoration, case-study expansion, contact targets, interactive diagrams, PDF access, reduced motion and reading without JavaScript. No runtime errors were recorded.
- WebKit exposed missing focus restoration after pointer activation of Quick CV. Dialog triggers now receive focus before opening. Also fixed a missing space in the mobile contact introduction.
- Desktop and mobile screenshots were reviewed. Generated browser binaries and screenshots stay inside the ignored `tmp/` folder. These are desktop engine/viewport checks, not physical iPhone or Android tests.
- GitHub Actions now runs the cross-browser suite after building and preserves screenshots when it fails.
- Search Console verification can be included in the initial HTML through `GOOGLE_SITE_VERIFICATION`. Ownership verification and sitemap submission remain pending the owner's Google verification token/account step.

Remaining evidence: screenshots or demos of the three AI systems, measured outcomes with baselines, physical-device review and independent recruiter feedback. `RECRUITER_REVIEW.md` provides the human-review tasks; no feedback has been fabricated.

## Owner-confirmed contributions, broader skills and sharing — 15 September 2026

Added independent/team contribution labels using the owner's clarifications. Crazy Techsol includes the complete website and voice assistant; Pain Divine, KR Energy Consultants and SK Security Services are independent website builds. GetMyHotels and 3 Bolt Court explicitly indicate team contributions. Brittania links to its verified HTTPS website and describes employee records, clocking, client onboarding/journey tracking, client login and invoicing. Lekhavali is marked as work in progress. No contribution scope was invented for the other listed sites.

Captured actual Crazy Techsol and Pain Divine homepage previews, with lazy loading and explicit dimensions. Their previews do not represent the separate AI architecture case studies. Added a 1200 × 630 sharing card rendered from an editable HTML layout using the existing portrait and type styling.

Self-hosted DM Sans and Barlow Condensed as WOFF2 and included their licenses. A live initial-page check recorded two Google Fonts requests before this change; local browser checks now record zero. This verifies removal of the external font dependency, not a measured Core Web Vitals improvement.

The three skills groups keep four visible essentials with keyboard-accessible native disclosures for additional expertise. Additions checked against the original PDF include OpenAI Realtime, Gemini Live, LLM guardrails, evaluation, tokenization/context management, Alembic, SonarQube, BrowserStack and Jenkins/GitLab CI/CD. No skill ratings, certifications or unsupported new experience were added.

Validation: production build and Chromium/Firefox/WebKit checks passed, including new contribution labels, actual preview loading, skill disclosure keyboard operation, social-image delivery and zero external font requests. Sharing image, website screenshots and mobile layout were visually reviewed. The final Brittania copy and expanded skills were checked at 320px. Updated checkout/setup-node actions to current published releases to remove the previous runtime deprecation warning.

Still pending: Google Search Console verification token, physical-device/assistive-technology review and measurement details behind the CV's broad percentage claims. No private internal-application screenshots or invented measurements were published.

## Text-only website entries — 15 September 2026

Removed both website screenshots, their public assets, capture script and unused styles at the owner's request. The selected websites and applications section now uses text throughout.

Expanded Lekhavali with its school-management scope while retaining the work-in-progress status. Added short descriptions for The Foot Doctor (healthcare services, specialists, clinic locations and appointment enquiries), Betfred (game discovery, category navigation and account access) and Sanguine Bio (laboratory instrument catalogue and enquiries). Descriptions use their public pages; they do not imply unconfirmed individual ownership or engineering scope. Original portrait and sharing-card assets are retained.

## Readability and accessibility follow-through — 16 September 2026

Subjective design/usability score remains **9.6/10**. The score is an editorial assessment; automated checks alone do not justify a 9.9 claim or a world ranking.

Kept description text aligned to the start edge and added progressive paragraph wrapping with a 65ch maximum measure on website descriptions. This preserves regular word spacing in narrow cards. The web-work group is now a named semantic section, resolving an axe manual-review flag about a label on a generic div.

Added axe to the existing browser verification workflow. Scans cover the full desktop/mobile reading state, Quick CV, mobile navigation and each expanded case study; reduced motion is used to expose all section content without animation timing. Initial scans found zero automated violations. Reports retain incomplete checks (notably decorative-layer contrast that the engine cannot resolve) for manual review, rather than suppressing them. Chromium, Firefox and WebKit interaction checks passed. WebKit also correctly returns focus to the menu button when Quick CV is opened from mobile navigation and then closed.

Search Console still requires the owner's verification tag or signed-in Google access. No connected browser is available for that account step. Physical-device and screen-reader testing, recruiter feedback and measurement baselines remain external validation tasks, not completed checks.

## Thirty-second introduction — 16 September 2026

Reworked the optional introduction into four chapters lasting 6, 8, 9 and 7 seconds. Thirty seconds gives the experience and AI content more reading time; a longer version would benefit from additional project evidence rather than simply longer holds. This is a design judgment, not a measured recruiter conversion result.

Replaced blurred uppercase scene changes with readable editorial typography and restrained geometric SVG motion. Added named chapters, elapsed time, pause/replay, keyboard navigation and work/contact destinations. Playback stops advancing while the document is hidden and starts paused for reduced-motion preferences. Navigation moves focus into the destination section.

Browser checks cover all four scenes at desktop, tablet, small phone, phone and landscape sizes, with pause, keyboard navigation, focus restoration, destination actions and reduced motion in Chromium, Firefox and WebKit. A real-time Chromium run checks the complete 30-second sequence and replay. A small-phone closing-screen overlap found during testing was corrected. Desktop, 320px phone and landscape screenshots were visually reviewed. Intro axe scans found zero automated violations; decorative-layer contrast still needs manual review. These checks do not replace physical-device or assistive-technology testing.

Overall subjective design/usability score remains **9.6/10**; no higher score is claimed without independent review.

## Recruitment positioning — 16 September 2026

Repositioned the hero, navigation, contact section and introduction around full-time AI engineering opportunities. The primary hero actions are now Download CV and View experience. Professional experience precedes the three AI case studies, and the eleven additional website/application examples are preserved in a keyboard-accessible native disclosure. This makes employment evidence easier to reach without removing previous work.

The profile and Quick CV share the owner's confirmed recruitment details: London, one-month notice, Skilled Worker visa valid until 2029, and employer sponsorship required for a new full-time position. The eight-plus years are explicitly full-stack experience. The current official Web Designer title is retained, with AI and application engineering responsibilities explained beneath it.

Updated search/sharing descriptions, llms files, README and browser checks. The optional animated introduction remains 30 seconds; INTRODUCTION_SCRIPT.md contains a separate proposed 40–50 second personal-video script. No personal video has been fabricated or uploaded.

Validation: the reordered page and additional-project disclosure passed Chromium, Firefox and WebKit checks. After the final full-time-only wording adjustment, Chromium checks and automated accessibility scans passed again, including the introduction, recruiter details, Quick CV and expanded project collection. Reviewed desktop and small-phone screenshots; checked the experience link's destination, focus and active navigation state. Automated accessibility scans reported zero violations, with decorative-layer contrast still flagged for manual review.
