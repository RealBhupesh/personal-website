# Website control dashboard

## Outcome

Expand the working owner-only writing studio into the content management dashboard for the entire portfolio. Bhupesh can change public content, manage projects and experience, publish posts and notes, curate open-source work, and fetch fresh GitHub data without editing source files or running terminal commands.

Keep the established GitHub storage, owner sign-in, media library, and deployment workflow. Save privately, review changes, then publish deliberately. Do not introduce a second database, a second login system, or a new paid service.

## Current implementation and deployment

- Public source: `RealBhupesh/personal-website`, branch `main`.
- Private drafts/media: `RealBhupesh/website-writing`.
- Primary authenticated dashboard: `https://www.bhupeshcholake.in/admin`.
- The Vercel URL `personal-website-ten-rho-90.vercel.app` belongs to the second `personal-website` project and deploys the same repository/branch. Public publication commits update both Vercel projects. The CMS continues to use the configured primary domain for authentication; do not register another app or change callbacks as part of this feature.
- Personal content currently lives in `config/site.ts`, `config/profile.ts`, `config/experience.ts`, and `config/work.ts`.
- GitHub discovery/settings live in `config/github.ts`, `lib/github-contributions-core.ts`, and `lib/github-contributions.ts`; the saved fallback is `data/github-contributions.json`.
- The graph currently loads through the calendar provider in `components/ui/github-activity.tsx`.
- Blog editing, private drafts, media, revision history, optimistic concurrency, and publication already exist. Extend those conventions.

## Dashboard areas

### Overview

Show unpublished site changes, drafts, published articles/notes, project count, latest successful GitHub sync, and publication/deployment status. Provide direct actions to edit profile, create content, sync GitHub, and review website changes. Counts must come from real stored records.

### Profile and About

Editable name, headline, location, contact email, public social links, short biography, full biography, About introduction, role sought, education summary, and last-updated date. Include the existing portrait and its alternative text/caption. Changing public profile content must not change the fixed owner allowlist or authentication credentials.

### Pages and navigation

Edit the introductions and descriptions on Home, Work, Writing, Notes, and About. Edit the Now section and update label; add/reorder/remove its entries. Manage navigation labels and order using valid site paths. Edit FAQs, supporting documented substitutions for live contribution totals and contact/location values. Control section visibility where appropriate without erasing saved content.

Move remaining hard-coded personal names, recent-role text, and social-link labels on public pages into the shared content data. A name edit must be reflected in the header, public metadata, structured data, and project attribution, not just one screen.

### Experience and education

Add, edit, reorder, and remove roles, organizations, periods, summaries, and individual achievement bullets. Manage education entries, training entries, and skill groups/items. Empty collections must render cleanly; the About page must not assume a recent role always exists.

### Projects

Add, edit, reorder, and remove projects and project groups. Controls cover title/display title, slug, summary, opening paragraph, full story paragraphs, category, status, intended audience, availability, traction text, stack, source/demo links, action label, image/alt/caption, and image dimensions.

Choose and order homepage projects directly; remove the hard-coded selected-slug list. Warn that changing or removing a published project slug changes its URL. Prevent duplicate slugs, missing group references, and homepage selections pointing to deleted projects. Empty project collections must not crash project navigation or metadata generation.

### Writing and notes

Keep all existing writing tools: rich text/Markdown, code, diagrams, media, tags, description, preview, drafts, autosave, history, duplication, archive, publish, unpublish, and deployment status. Add Notes as a first-class content type with the same tools and its own public `/notes` destination and ordering. Existing posts default to the blog type without changing their URLs or losing custom MDX. Published content type and slug remain locked unless explicitly migrated.

### Open source and GitHub

Provide a public-PR table with repository, title, number, actual status, creation/merge dates, attribution type, and source/evidence links. Search/filter by repository and open/merged/closed state. Highlight or hide entries from curated selections while retaining the complete verified contribution record. Edit repository display names, summaries, and descriptions separately from GitHub facts.

Add a PR by URL, including a newly created PR. The server fetches its actual public repository, author, title, and status from GitHub; it never accepts user-supplied status/count values. Authored work and verified co-authored work are identified separately. Explicit manual credit requires an evidence link and is labeled as credited work rather than represented as an authored PR.

Expose Sync pull requests, Sync contribution calendar, and Sync all. Show last attempt, last success, result counts, and actionable failures. Keep automatic updates; manual synchronization supplements them. Do not equate commit counts with PR counts or provide an arbitrary numeric contribution-count editor.

Synced data can be reviewed in the dashboard before publication. The UI must clearly state that publishing the saved snapshot updates the website fallback through deployment. Routine live refreshes continue to read the published GitHub settings. Retain the last complete snapshot on network failures, rate limits, or truncated search results; a failed sync must never replace real data with empty or partial totals.

### Media and site settings

Reuse the private media library for profile, project, and article images. Publish only assets referenced by the published content. Include accessible alternative text and captions. Preserve the existing image validation and upload limits.

Edit the site title, description, social sharing image, and page metadata. Export content as JSON and import it into a private draft after validation. Show the canonical website/repository/deployment destinations as settings information. GitHub secrets, OAuth callbacks, owner access, and infrastructure configuration remain server-side and are not exposed as ordinary content fields.

## Content model

Introduce validated, data-only JSON for public site content, initially migrated exactly from the current configuration and personal copy. Preserve existing exported configuration interfaces through typed adapters so public pages, feeds, structured data, and project routes continue to read one consistent source.

The public JSON contains profile, page copy, roles, education, skills, project groups/projects, homepage selection, curated contribution descriptions, GitHub data settings, and visibility preferences. Authentication ownership stays in server-owned CMS configuration.

The private website draft stores the validated content, optional synchronized GitHub snapshots, server-owned update/publication metadata, and the base public file revision. The browser supplies content and an expected revision, not a public repository path, commit SHA to overwrite, or publication state.

Use bounded schemas for strings/collections and strict URLs. Disallow executable code, unsafe URL protocols, invalid slugs, duplicate identifiers, dangling references, and arbitrary file paths. Forms are normal labeled inputs and list editors; raw JSON is an import/export format, not the main editing interface.

## Services and publication

Add a focused site-content service using the existing Repository abstraction. It supports reading public/private versions, validated draft saves, change review, revision history, restoring a revision as a new private draft, resetting to the published version, and publishing.

Publication compares the saved base revision with the current public file and uses the existing atomic Git commit/branch-head check. Commit the public site JSON, selected GitHub snapshots, and referenced media together. An unrelated publication or outside edit must produce a recoverable conflict rather than silently overwrite it. Reconcile a successful public commit if private bookkeeping subsequently fails, using the existing article publication design as precedent.

Site publication and article publication remain explicit operations. Restoring/importing/syncing does not silently publish unrelated saved edits. Show affected sections and changed fields before publishing, then track the deployment commit. Draft status and deployment status are separate.

## UI and behavior

Extend the current studio rather than create another dashboard. Use clearly named navigation groups for Website content, Writing, GitHub, Media, and Settings. Each editor has a useful description, saved/unsaved state, local recovery, Save draft, Review changes, and a current-site link.

Repeated records use labeled editors with add/remove/move controls, accessible names, and sensible collapsed summaries. Long fields get textareas; booleans get real switches/checkboxes; controlled values use selects. Explain validation errors beside the relevant field and preserve entered text.

Reuse Radix dialogs/dropdowns and the current visual language. Keep content visible by default, avoid layout-shifting entrance animations, preserve keyboard focus, respect reduced motion, and make desktop/mobile forms readable. Check actual interactive controls and clipped edges in the built-in browser when access is available. Do not report browser QA as complete while browser control is disabled.

## Implementation sequence

1. Migrate content to validated JSON and adapt public readers while preserving current rendered content and URLs.
2. Add site draft/review/history/publication APIs with owner checks, origin checks, concurrency protection, recovery, and referenced-media publication.
3. Add the dashboard's profile/pages/experience/projects/settings editors and shared list/field controls.
4. Add GitHub inspection, verified PR import, manual sync, calendar snapshot support, and sync/error status.
5. Extend existing articles to support Notes while preserving existing blog content.
6. Exercise local workflows and owner authorization, run checks, verify layouts/controls where browser access permits, publish the code, and verify the correct Vercel deployment.

## Acceptance and verification

- Editing a name or bio updates all corresponding public views/metadata after publication; saving alone keeps it private.
- Roles, skills, education, projects, categories, and homepage selections can be managed without source edits, including empty-state handling.
- Existing project and article URLs/content remain unchanged after initial migration.
- Imported/reordered/restored content round-trips without data loss; stale draft/public revisions fail safely.
- Site changes and referenced media publish atomically; drafts and unreferenced uploads remain private.
- A new public authored PR can be imported by URL and refreshed to its actual merged/closed status without inflating totals or conflating commits and PRs.
- Incomplete GitHub results and calendar failures preserve the last successful snapshot and display an error.
- Both automatic refresh and explicit synchronization continue to work with the published settings.
- Notes and posts publish to their correct destinations; old blog records remain valid.
- Unsigned callers, wrong-owner sessions, forged publication fields, cross-origin writes, unsafe URLs, and invalid file paths are rejected.
- Meaningful service/HTTP regression tests cover the above. Existing auth callback-to-dashboard, article preview, editor, and contribution-discovery tests remain green, along with lint, TypeScript, and production build.

## Deliberate boundaries

This is content administration for the existing portfolio, not a drag-and-drop page-code builder, multi-user permission system, hosting console, or analytics product. Those are separate products and must not be simulated with nonfunctional controls. Every control included here must save, sync, preview, restore, or publish real data.
