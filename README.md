# Bhupesh Cholake

Personal site. Edit content, not components, when the words change.

- Bio, links, Now, navigation, experience: `config/site.ts`
- Projects, collections, and homepage selection: `config/work.ts`
- Experience and editorial open-source highlights: `config/experience.ts`
- GitHub account, public commit identities, and optional attribution overrides: `config/github.ts`
- Notes: `content/notes`
- Writing: `content/blog`
- Resume PDF: add `public/resume.pdf`
- Canonical domain: `url` in `config/site.ts`

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
actual final `Co-authored-by` trailers matching the public identities in `config/github.ts`.
Maintainer-consolidated patches require explicit original-patch credit plus a reference to
an authored PR in the same repository. A mention or copied release note is not credit.
The About page links to the evidence. GitHub indexes commit search on default branches only;
PR-body discovery also covers credited work on other branches. A new email identity must
be added to the config. Optional PR overrides remain available for unindexed attribution.
Issues, reviews, private repositories, and direct commits are not counted as PRs. Multiple
commits inside one PR still count as one PR. The separate calendar continues to show GitHub contribution activity.

Run `npm test` for contribution discovery, pagination, status, and completeness regressions.
