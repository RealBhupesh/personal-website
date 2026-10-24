# Bhupesh Cholake

Personal site. Edit content, not components, when the words change.

Search metadata, Google/Bing verification, and AI-readable content: [SEO setup and maintenance](docs/seo/README.md). Run `npm run test:seo` against a production server for the public crawl checks.

- Manage content in the owner dashboard at `/admin`.
- Published profile, pages, projects, experience, images, FAQs, and GitHub settings: `data/site-content.json`.
- `config/*.ts` are typed adapters for the public site, not separate content stores.
- Published notes: `content/notes`; articles: `content/blog`.
- Resume PDF: add `public/resume.pdf`.
- Canonical domain changes also require hosting/auth configuration; the dashboard shows this field read-only.

## Automatic open-source contributions

The homepage, Work page, About page, structured data, and `llms` routes share `getGitHubContributions()`.
GitHub's public PR search discovers every authored PR to repositories owned by others,
including open and closed PRs. Merge counts use GitHub's `merged_at`, not a hand-written count.
There is no project whitelist or three-project limit. Pagination covers the full history;
searches over GitHub's 1,000-result ceiling split into disjoint creation-date ranges.

Next.js caches GitHub responses and revalidates these pages after one hour when visited.
New PRs and status changes appear after GitHub indexes them and the cache refreshes, without
a code change or redeployment. Unauthenticated public API requests work out of the box.
An optional server-only `GITHUB_TOKEN` increases API capacity; never prefix it with `NEXT_PUBLIC_`.

If GitHub fails, rate-limits requests, or returns incomplete results, the site uses
`data/github-contributions.json` and labels it as a saved list. Refresh that emergency snapshot
with `npm run refresh:contributions` (Node 22.18+). The script writes only after a complete fetch.
Authored PRs, imported fork contributions, and co-authored squash commits are discovered
without a repository whitelist. Import candidates are verified against PR commit authors and
actual final `Co-authored-by` trailers matching the public identities in `data/site-content.json`.
Maintainer-consolidated patches require explicit original-patch credit plus a reference to
an authored PR in the same repository. A mention or copied release note is not credit.
The About page links to the evidence. GitHub indexes commit search on default branches only;
PR-body discovery also covers credited work on other branches. A new email identity must
be added under Website content → Site settings. Use GitHub activity to verify a PR URL or supply explicit credit with an evidence link.
Issues, reviews, private repositories, and direct commits are not counted as PRs. Multiple
commits inside one PR still count as one PR. The separate calendar continues to show GitHub contribution activity.

Run `npm test` for contribution discovery, pagination, status, and completeness regressions.

## Website dashboard

Open `/admin` on the primary domain (`www.bhupeshcholake.in`). **Website content** manages profile/About, page copy, navigation, homepage visibility, experience, education, skills, projects/groups/selection, Now, FAQs, images, and metadata. **GitHub activity** inspects/filter PRs, verifies new PR URLs, and syncs PRs or the yearly graph into a private draft.

Use **Save draft → Review changes → Publish website changes**. Saving, importing JSON, restoring history, and syncing do not publish. Site history, JSON import/export, reset, local recovery, and revision conflicts protect edits. Changing project slugs removes their old URLs; review warns about those removals. Auth ownership and infrastructure remain server-controlled.

**Articles & notes** retains a visual/Markdown editor, templates,
autosave and recovery, private media, website previews, tags and search metadata,
revision restore, archive, import/export, and publish/unpublish controls. Notes have their own `/notes` destination and ordering; published types/URLs stay locked.

Drafts use the separate private `RealBhupesh/website-writing` repository. Published MDX
and referenced assets are committed to this website repository, triggering its existing
deployment. One-time GitHub App configuration is required before production sign-in.
See [the setup guide](docs/cms/setup.md) for the exact permissions and environment variables.

For local writing and testing, run `npm run cms:dev`. This stores drafts in ignored `.cms/`
and publishes only into the local checkout. `npm run test:cms-http` tests a running local
workspace and cleans up its temporary posts. Never expose this development port publicly.

`CMS_TEST_URL=http://127.0.0.1:3101 npm run test:cms-site-http` checks the new site API against a local `cms:dev` server. It temporarily publishes local test content and restores the original public JSON and prior private draft in `finally`. Run it before the production build, rather than concurrently. Both connected Vercel projects deploy publication commits; authentication continues to use the primary domain.
