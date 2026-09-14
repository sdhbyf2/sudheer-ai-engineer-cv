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
