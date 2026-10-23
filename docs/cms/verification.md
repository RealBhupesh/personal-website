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
