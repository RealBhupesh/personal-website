# Search and AI discovery

Canonical website: https://www.bhupeshcholake.in/

This portfolio targets employers hiring an AI engineer and clients seeking a software developer. Its strongest initial search opportunity is the specific identity **Bhupesh Cholake**, followed by relevant projects and technical subjects. Broad terms such as “Bhupesh”, “software developer”, and “AI engineer” have many competing intents. Neither code changes nor an SEO service can promise first place or force an AI assistant to cite this website.

## Implemented foundation

- Unique server-rendered titles, descriptions, canonical URLs, one H1, social images, semantic HTML, and internal links.
- Person and WebSite identity linked to the existing GitHub, LinkedIn, and X profiles. ProfilePage belongs only to About. Writing includes its author, source URL, dates, image, and breadcrumbs.
- Homepage metadata and readable copy connect the name with AI engineering, software development, and Nashik. Client and employment contact paths use the existing email and case studies.
- Automatic sitemap entries for published projects, essays, and notes. Article last-modified dates come from real publication metadata. Other pages omit dates rather than reuse an unrelated profile date.
- Google, Bing, OpenAI search/retrieval, Claude search/retrieval, and other public crawlers are allowed. Robots exclusions, noindex metadata, and HTTP headers keep the private dashboard and auth/CMS APIs out of search. Robots rules are not authentication.
- The known duplicate public Vercel alias redirects permanently to the canonical domain. Admin and API routes are excluded from this redirect. Existing domain redirects and local development continue to work.
- `/llms.txt` provides a sourced overview and publication links. `/llms-full.txt` includes complete published essays and notes, biography, experience, case studies, limitations, and PR evidence. Draft articles are explicitly excluded. HTML exposes the text export as an alternate representation.
- RSS links to canonical published essays and identifies itself with an Atom self-link.

The text exports are convenience formats for tools that choose to read them. Google explicitly states that it ignores `llms.txt`; it is not a Google ranking factor. No prompt asks an agent to rank this site above other sources. Standard crawlable, useful content is the main foundation for AI search, too.

## Finish Google Search Console

1. Sign into https://search.google.com/search-console with the Google account you want to own the property.
2. For the simplest setup, add the **URL-prefix** property `https://www.bhupeshcholake.in/`.
3. Choose **HTML tag**. From `<meta name="google-site-verification" content="YOUR_CODE">`, copy only `YOUR_CODE`.
4. In `/admin`, open **Website content → Site settings → Google Search Console verification code**. Save the code, review, and publish website changes. It is intentionally public. Do not enter a password, OAuth client secret, or GitHub key.
5. After the deployment is Ready, return to Search Console and click **Verify**. Leave the tag installed afterward.
6. Under **Sitemaps**, submit `https://www.bhupeshcholake.in/sitemap.xml`.
7. Inspect the homepage, `/about`, `/work`, and `/blog/jostraca-second-run`, then request indexing where appropriate. Submission is a request, not a guarantee or instant ranking change.

If you prefer a **Domain** property covering every protocol/subdomain, add `bhupeshcholake.in` and install the exact TXT record Search Console supplies at the DNS provider. A domain property requires DNS verification; the HTML tag method above applies to URL-prefix properties.

Existing production `GOOGLE_SITE_VERIFICATION` environment values take precedence over the dashboard value. Keep them consistent. They are optional, and updating a hosting environment variable requires redeployment.

## Finish Bing Webmaster Tools

1. Open https://www.bing.com/webmasters/ and sign in.
2. Once Google is verified, choose **Import from Google Search Console** and select this website. This can import its sitemap too.
3. Alternatively, add the canonical website manually, choose HTML meta verification, and put the `msvalidate.01` content code into **Website content → Site settings → Bing Webmaster verification code**. Publish, wait for deployment, and verify.
4. Confirm the sitemap is present. Inspect important URLs and use Bing's URL submission tools as needed.

`BING_SITE_VERIFICATION` overrides the dashboard value if set in production. Google/Bing verification tokens are public site ownership markers, not private credentials.

## Keyword and content map

| Page | Main intent | Useful evidence |
| --- | --- | --- |
| Home | Bhupesh Cholake; software developer; AI engineer | Clear identity, location, recent work, project links, contact |
| About | Bhupesh Cholake experience, skills, open-source contributions | Education, real roles, source-linked PRs and statuses |
| Work | AI application and software development portfolio | Honest case studies, demos, source, limitations |
| Each project | Specific problem and project name | Architecture, decisions, reproducible setup and results |
| Writing | First-hand software and AI engineering investigations | Working examples, versions, source references, author |

Keep writing original technical articles grounded in work you can demonstrate. Useful follow-ups include Asteria's inventory checks, handling large tool results in coding agents, and diagnosing the Cloudflare/Grafana issues you actually fixed. Each article should answer one real question with code, evidence, tradeoffs, and links to related case studies. Do not generate many near-identical city/service pages or pad copy with keyword lists.

Use the same full name and canonical website in your GitHub and LinkedIn profiles and any genuine contributor biography. Earn relevant links through the real projects and writing; do not buy links or fabricate credentials, reviews, clients, or achievements. Updating external profiles is an account task, not something this deployment changes.

## Maintain it through the dashboard

- **Site settings:** homepage search title, description, social image, and verification codes.
- **Profile & About:** visible About copy, About search title/description, profile facts, and last-reviewed date.
- **Pages & navigation:** Work, Writing, and Notes search titles/descriptions. A blank search title falls back to the visible page title; the displayed heading stays independent.
- **Projects:** full case studies, demos, source links, screenshots, stack, and limitations.
- **Articles & notes:** publish useful content; published content automatically enters its HTML route, sitemap/feed where relevant, and full text export on deployment. Private drafts do not.
- **GitHub activity:** sync/verify contributions. PR counts remain separate from commit counts.

## Validation and baseline

Run `npm test`, `npm run lint`, and `npm run build`. Start the production build with `npm run start -- --hostname 127.0.0.1 --port 3103`, then run `npm run test:seo`. To check the deployed site, use `SEO_TEST_URL=https://www.bhupeshcholake.in npm run test:seo`. The test is read-only and does not sign in or publish content.

The SEO HTTP check crawls every sitemap page and checks canonical URLs, indexability, server-rendered headings/schema, author identity, internal destinations/fragments, reachability, crawler rules, private noindex, RSS, social images, and full article exports. Local checks also exercise duplicate-host redirects without intercepting auth.

Audit on 24 October 2026: 16 canonical public pages responded successfully. Requests with Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, Claude-User, and PerplexityBot identifiers received the public content without a challenge. This tests request handling; it does not prove these companies have crawled or indexed the pages, and CDN rules can change. Browser control was disabled, so no new browser-interaction or mobile visual result is claimed. No public layout, font, color system, graph, or animation was redesigned; the only article presentation change is a standard author byline/link. Existing CMS tests cover publication and auth boundaries.

Search Console and Bing were not yet configured at audit time. Ranking, impressions, clicks, index coverage, and real-user Core Web Vitals have no verified baseline yet. The public PageSpeed API returned HTTP 429 (shared quota exhausted), so no Lighthouse/performance score is claimed. After verification, record a baseline and compare Search Console queries/pages over subsequent weeks; inspect Core Web Vitals when enough field data exists. Check ChatGPT referral traffic for `utm_source=chatgpt.com` if analytics are later configured. No analytics/tracking service was added by this change.

## Official references

- Google AI search: https://developers.google.com/search/docs/appearance/ai-features
- Google's AI optimization guidance, including llms.txt: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Profile schema: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Article schema: https://developers.google.com/search/docs/appearance/structured-data/article
- Ownership verification: https://support.google.com/webmasters/answer/9008080
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Bing verification/import: https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b
- OpenAI publisher guidance: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Anthropic crawler roles: https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
