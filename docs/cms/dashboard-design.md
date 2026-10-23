# Writing dashboard proposal

Date: 23 October 2026
Status: Approved by the owner on 23 October 2026.

## Goal

Bhupesh can write and manage blog posts in a private browser dashboard, then publish them to the existing website without editing source files or using Git commands.

## Existing website

- Next.js 16.3.5 and React 19.
- Articles are MDX files in `content/blog`; the current essay includes custom diagram components.
- The website repository, `RealBhupesh/personal-website`, is public.
- GitHub pushes already trigger website deployments.
- No CMS authentication or persistent backend is currently configured.

## Chosen storage approach

Use GitHub for persistence, history, and the existing publication pipeline. Keep drafts, revisions, and unpublished media in a separate private repository. Publish only approved article files and referenced media to the website repository. A draft flag in a public repository does not provide draft privacy.

Other approaches considered: a managed database supports rapid autosave and scheduling but adds a new backend dependency; a hosted CMS supplies an established editor but adds another service and a separate content model. GitHub storage was selected by the owner.

## Dashboard design

A full-width writing workspace at `/admin`, independent of the public site's narrow article layout. Use the site's existing type and neutral palette, restrained surfaces, and clear text controls. The article being edited is the focal artifact. Keep navigation stable and all content visible without entrance animations.

Navigation: Overview, Posts, Media, Settings. The overview shows real post counts and recent edits, not invented visitor analytics.

### Post library

- Search by title, description, and tags.
- Filter drafts, published posts, unpublished changes, and archived posts.
- Sort by recent edit, publication date, and title.
- Create a blank post or start from an essay, tutorial, or project-update template.
- Duplicate, archive, restore, and export Markdown.
- Import existing website articles without changing their URLs or content.

### Editor

- A writing view with familiar formatting tools, plus a Markdown source view.
- Headings, bold, italic, links, lists, quotes, tables, code blocks, and images with alt text and captions.
- Preserve existing custom MDX diagrams and code snippets. Do not silently rewrite unsupported blocks through the visual editor; retain them in source mode.
- Desktop split preview and a focused single-pane writing mode; mobile editing with a separate preview tab.
- Preview uses the website's actual article rendering and theme.
- Word count, estimated reading time, document outline, and keyboard shortcuts.
- Autosave with explicit Saving, Saved, Offline, and Conflict states. Retain a device recovery copy and never claim persistence when a network write fails.
- Revision history with preview and restore; restoration creates a new revision.

### Post settings

- Title, description/excerpt, URL slug, tags, publication date, and social image.
- Search-result preview and social-share preview.
- Clear validation of missing fields, unsafe links, duplicate slugs, and unsupported content.
- Published slugs stay stable by default. Changing an already-published URL is disabled in this release to protect existing links.

### Media

- Upload supported raster images with file size and type validation.
- Store unpublished uploads privately; serve them through authorized dashboard requests.
- Browse, search, insert, and edit image descriptions.
- Promote only referenced media on publication.
- Do not remove public assets still referenced by published articles.

### Publishing

- Review a pre-publication checklist, preview the article, then publish.
- Commit the article and its referenced assets together to the website repository.
- Show the commit and deployment status separately: publishing is not live until deployment succeeds.
- Allow editing a published article without changing the live version until Publish changes is selected.
- Unpublish removes the public article through the same deployment pipeline while retaining its private source and history.
- Surface deployment errors and retry safely without creating duplicate posts.
- Published posts appear consistently in Writing, article URLs, RSS, sitemap, social previews, and machine-readable content.

Scheduled publishing is outside the first release: it requires a reliable scheduler in addition to a date field. The dashboard must not pretend a future date is a functioning scheduler.

## Authentication and authorization

Use GitHub sign-in and an established OAuth/session implementation. Allow only the owner's verified GitHub account. Check authentication and authorization in every server operation, including previews, media, revisions, and publishing. Exclude admin routes from indexing; this is separate from access control.

Use a narrowly scoped GitHub App installed only on the private content repository and the website repository. Keep credentials and tokens on the server. Use secure HTTP-only cookies, OAuth state protection, validated mutation origins, and bounded request sizes. Never reuse a local developer token as a production credential.

GitHub App registration, installation approval, and deployment secrets are required setup steps. No GitHub App or production secret is configured yet. The implementation must display a truthful setup state until they exist.

## Backend boundaries

- Content model and validation: typed article metadata, stable IDs, allowed blocks, safe slugs, asset references, and deterministic MDX serialization.
- Private store: list, read, save with expected revision, archive, media, and history.
- Public publisher: validate, stage article and assets, create one commit, inspect deployment, and retry idempotently.
- Auth boundary: owner identity and per-request authorization.
- Dashboard UI: safe content DTOs, editing state, previews, and actionable errors; no server credentials.

Use GitHub file or branch SHA checks to detect concurrent edits. A conflict preserves the writer's text and offers a comparison instead of overwriting another revision. Publishing and private bookkeeping may fail independently; retain the publication commit ID to reconcile retries.

## Verification

- Unit tests for content validation, Markdown/MDX round trips, slug collisions, private/public asset selection, and publication payloads.
- Integration tests for unauthorized access, stale revisions, save failures, publication retries, and preventing draft exposure.
- Browser checks for create, edit, save, reload, preview, upload, publish, edit without republishing, unpublish, archive, and restore.
- Confirm the existing essay retains its diagrams, highlighted code, table of contents, metadata, and URL.
- Verify mobile layout, keyboard navigation, focus, contrast, reduced motion, and recovery after an interrupted save.
- Run the project's tests, lint, and production build before shipping.
- Exercise publishing on test content and verify that no test article remains public afterward.

## Ready-for-use criteria

The owner can sign in, write a draft, return later and recover it, preview it accurately, publish it, and see it on the public website after deployment. Editing a live post does not expose an unfinished draft. Save errors and deployment failures are visible and recoverable.
