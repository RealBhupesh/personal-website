import { readFile, writeFile } from "node:fs/promises";
import { fetchPublicPullRequests } from "../lib/github-contributions-core.ts";
import { siteContentSchema } from "../lib/cms/site-model.ts";
import { verifiedPullRequest } from "../lib/cms/github-admin.ts";
const { github: settings } = siteContentSchema.parse(
  JSON.parse(
    await readFile(
      new URL("../data/site-content.json", import.meta.url),
      "utf8",
    ),
  ),
);
const { username: githubUsername, creditEmails: githubCreditEmails } = settings;
if (process.argv.includes("--check")) {
  console.log(`GitHub refresh configuration valid for ${githubUsername}.`);
  process.exit(0);
}

const request = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "bhupesh-portfolio",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
};
const found = await fetchPublicPullRequests(
  githubUsername,
  request,
  [],
  githubCreditEmails,
);
const byUrl = new Map(found.map((p) => [p.url.toLowerCase(), p]));
for (const credit of settings.creditedPullRequests) {
  const pr = await verifiedPullRequest(credit, settings, request);
  byUrl.set(pr.url.toLowerCase(), pr);
}
const prs = [...byUrl.values()];
await writeFile(
  new URL("../data/github-contributions.json", import.meta.url),
  JSON.stringify(
    {
      username: githubUsername,
      updatedAt: new Date().toISOString(),
      prs,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved ${prs.length} public PRs across ${new Set(prs.map((pr) => pr.repository)).size} repositories.`,
);
