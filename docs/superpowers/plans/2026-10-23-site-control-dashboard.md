# Full-site content dashboard implementation

Goal: Manage the existing portfolio and GitHub activity through the owner dashboard; keep all current public content and URLs intact on installation.
Architecture: Validated public JSON, typed config adapters, private revisioned site drafts, atomic Git publication, existing owner authentication and repositories. Extend article records for notes.
Tech Stack: Next.js 16, React 19, Zod 4, Radix, existing Repository/CmsService.
Spec: docs/superpowers/specs/2026-10-23-site-control-dashboard-design.md
Global Constraints: No public redesign, no auth changes, no secrets in content, private until publish, reject stale writes. Leave output/ and tmp/ alone. User has authorized implementation and GitHub push.
Review Focus: Publication races/retry recovery, draft leakage, unsafe URLs/imports, empty collections, removed project references, backwards-compatible article digests and URLs, incomplete GitHub results, editor navigation losing changes.

- [x] Task 1: Migrate config to data/site-content.json and typed adapters; extract page copy without styling changes. Validate duplicate/dangling references and URLs. Tests: exact migration baseline and schema rejection, TypeScript.
- [x] Task 2: SiteService and authenticated site API: get/save/review/history/restore/reset/import/export/publication; media references; CAS and public bookkeeping recovery. Tests: MemoryRepository workflows and failure injection.
- [x] Task 3: SiteManager and schema-driven accessible fields/lists, private recovery, review dialog, history, settings, media picker. Extend studio navigation with save-before-leave. Tests: form operations and HTTP save/review workflow.
- [x] Task 4: GitHub inspector and verified PR URL import; separate calendar/PR sync and status; retain complete snapshots on failure; public automatic refresh remains. Tests: mocked API facts/credit/rate limits; schema and server constraints.
- [x] Task 5: Notes kind and ordering in existing editor/service, import and publish paths; existing blog compatibility. Tests: kind lock, separate slug namespaces, note publication.
- [ ] Task 6: Full regression suite, lint, types, build, local HTTP workflow, available built-in browser QA, final independent review, fix material findings, commit and push main, check deployment.
