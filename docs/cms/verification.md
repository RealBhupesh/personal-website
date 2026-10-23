# CMS verification record

23 October 2026

## Completed

- Automated tests cover the content model, visual editor Markdown round trips, private/public separation, revision conflicts, duplicate slugs, imported essay preservation, MIME validation, referenced media selection, GitHub blob reads, atomic Git commits, and retry reconciliation.
- Local HTTP checks exercise create, save, reload, stale writes, history, import, authenticated image upload/retrieval, description updates, publish, edit without publication, duplicate, unpublish, and archive. Test-owned files are removed afterward.
- The actual Server Action preview rendered the existing essay with its code and SVG diagrams. Executable MDX was rejected before compilation.
- A production build served the public routes, feed, sitemap, and essay successfully. Admin data routes returned 503 before setup. Enabling CMS_LOCAL_MODE did not bypass production authorization.
- Lint, TypeScript, and production build passed.
- Production dependencies have no reported npm audit vulnerabilities. The existing ESLint dependency chain still reports development-only braces/fast-glob advisories; npm suggests an incompatible framework downgrade, which was not applied.
- Created and verified the private `RealBhupesh/website-writing` repository and imported the current public essay with its original GitHub source SHA.

## Design-law review

Static review covered the supplied law's typography, palette, composition, controls, motion, clipping, readability, alignment, shadows, decoration, and privacy/setup states. The dashboard uses the existing type voice, tonal surfaces, actual posts, and a writing-first canvas. There are no gradients, glows, decorative tiles, fake analytics, entrance reveals, hover lifts, or inert decorative controls. Text uses explicit gutters. Dialogs use Radix focus management. Editor content has a readable pre-hydration fallback. Reduced motion disables transitions. Admin styling is isolated from the public layout.

Actual pointer, screenshot, optical alignment, and responsive browser checks are **not complete**: the browser tool reported that local browser use is disabled in Work settings. Static CSS review and editor DOM integration tests do not replace these checks. Do not claim visual verification until browser access is enabled and those checks run.

## Requires owner setup

Production GitHub sign-in and installation-token publication have not been exercised because the GitHub App credentials do not exist in the deployment yet. Follow setup.md. The dashboard intentionally remains on its setup screen until configured. No live publication test was performed with unconfigured credentials.

## Full-site dashboard, 23 October 2026

- Original profile, both biographies, roles, skills, education, all 11 projects, project groups, homepage selection and open-source introduction were compared to the pre-migration exports and matched exactly. Public layout classes, styles, images, project slugs, and existing essay MDX were retained.
- 45 automated tests passed with no skips when the authenticated HTTP regression server was enabled. The installed Auth.js pipeline and actual dashboard route accept the owner session; wrong accounts and forged updates remain rejected.
- Local article HTTP, preview Server Action, and new site HTTP smoke checks passed: origin/host rejection, private saves, stale revisions, field validation, history, publication, metadata propagation, private images, code/custom diagrams, notes namespace and publication.
- Lint, TypeScript and optimized production build passed. No test marker was found in generated public build output. Local HTTP publication checks restore source JSON/private drafts and were not committed as public content.
- Built-in browser checks covered profile save/review/reset; list reordering; visibility checkboxes; revision history and restore; image picker; PR search/status filtering; calendar synchronization; incomplete-draft recovery from a fresh tab; and creating/saving a Note with its own type/order. The temporary browser QA note was removed. Mobile 390px checks found no horizontal page overflow or clipped controls. Viewport override was reset.
- Fresh independent branch review found four material issues: incomplete recovery rejection, plain-Node refresh import failure, note/blog import ID collision, and incomplete-calendar acceptance. All were fixed with regression coverage; public and manual calendar refresh now share the completeness checks. No deferred findings or declined behaviors remain.
- Design audit rechecked the supplied anti-slop law against the complete changed interface: existing studio type/palette retained; no new decorative gradients, glows, faux windows, fonts, icon tiles, hover lifts or entrance hiding; fields have labels and inline errors, tonal record surfaces, consistent gutters, working controls, and responsive wrapping. The user's instruction to preserve the public website governs the retained public design.
