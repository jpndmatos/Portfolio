# Project refresh

## Direction

Present working tools and their full source, with Touchline among the first projects and Relay later in the selection. Preserve each application's own visual identity. Remove portfolio demo calls to action rather than presenting local simulations as deployed backends.

## Work plan

- [x] Audit portfolio links, repositories, startup paths, and interaction states.
- [x] Publish Relay's complete source to its own GitHub repository.
- [x] Curate the portfolio order, descriptions, screenshots, and direct source/app links.
- [x] Refine Split's ledger and expense workflow.
- [x] Refine Overlap's timeline and meeting workflow.
- [x] Refine Image Desk's processing and export workflow.
- [x] Refine EatEasy's server-backed restaurant and booking workflow.
- [x] Refine Relay's server-backed incident workflow.
- [x] Review Touchline's source and portfolio handoff.
- [x] Run the relevant builds, domain checks, responsive/accessibility and interaction checks.
- [x] Review the actual interfaces and fix observed issues.
- [x] Push the portfolio and verify its browser checks and deployment.

## Initial findings

The portfolio currently leads with Relay, links to browser-only exports, and distributes Relay as a ZIP. Touchline is absent. Split, Overlap, Image Desk, EatEasy, and Touchline already have GitHub remotes; Relay currently has no remote. Overlap is the time-zone timeline project. Split and EatEasy have real database-backed applications; their static exports are a separate implementation mode. Overlap and Image Desk perform their actual work in the browser.

## Delivery rules

Keep existing work and user data intact. Use full app builds for verification. Do not upgrade paid hosting, invent project metrics, add testimonials, or call simulated persistence a live backend. Report remaining hosting or provider limits honestly.

## Implementation notes

Touchline, Split and Overlap lead the selection; Relay is sixth and has its own complete GitHub repository. The portfolio now links to complete apps or source, with actual viewport screenshots. Browser-only exports, the Relay ZIP and obsolete export tooling are removed from this repository. Pages packages an explicit public directory instead of uploading the whole repository.

Split previews exact shares using the server calculation and preserves allocation order during editing. Overlap keeps the meeting instant when changing its reference and gives timelines a full-height desktop panel. Image Desk reports processed dimensions and avoids nested thumbnail scrollbars. EatEasy now uses bundled illustrative photography, retains booking choices after errors, previews the booking and protects form writes with CSRF; cancellation and removal use POST. Relay aligns incident IDs and titles, recovers obsolete pages and links to its source repository.

The additional Touchline phone pass creates one shared footer, larger controls, a borderless mark, coloured post tags and a clear seen indicator. Taller phones retain the feed below a widescreen player; short phones keep the focused player. Search returns to results, and browser checks cover footer position, phone target sizes, source disclosures and scroll continuity.

## Verification

Local unit/domain checks: Split 15, Overlap 12, Image Desk 7, Relay frontend 18 and .NET 25, Touchline frontend 44. Touchline CI also runs 94 backend tests and container checks. EatEasy's isolated PHP/SQLite test covers sign-in, CSRF rejection, bookings, conflict recovery, cancellation, admin creation/removal and private storage. Separate browser workflows exercise real processing/API paths, calendar continuity and accessibility at desktop, phone and landscape sizes. See each repository's workflow runs for the current revision.

Published verification: portfolio workflow `42067875533` passed its browser/accessibility checks and Pages deployment. Touchline workflow `42066918938` passed viewport, accessibility, playback recovery, scroll retention, backend and container checks. The feature commits in Split, Overlap, Image Desk, EatEasy and Relay also passed their application workflows. Screenshot-only documentation updates skip redundant CI runs.
