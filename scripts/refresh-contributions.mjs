import { writeFile } from "node:fs/promises";
import { fetchPublicPullRequests } from "../lib/github-contributions-core.ts";
import { githubUsername, coauthoredPullRequests, githubCreditEmails } from "../config/github.ts";

const request = async url => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "bhupesh-portfolio",
      ...(process.env.GITHUB_TOKEN ? {Authorization: `Bearer ${process.env.GITHUB_TOKEN}`} : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
};
const prs = await fetchPublicPullRequests(githubUsername, request, coauthoredPullRequests, githubCreditEmails);
await writeFile(new URL("../data/github-contributions.json", import.meta.url), JSON.stringify({
  username: githubUsername, updatedAt: new Date().toISOString(), prs,
}, null, 2) + "\n");
console.log(`Saved ${prs.length} public PRs across ${new Set(prs.map(pr => pr.repository)).size} repositories.`);
