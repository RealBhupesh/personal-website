import { cache } from "react";
import { contributions as curated } from "@/config/experience";
import { coauthoredPullRequests, githubCreditEmails, githubUsername } from "@/config/github";
import snapshot from "@/data/github-contributions.json";
import { fetchPublicPullRequests, type GitHubPullRequest } from "@/lib/github-contributions-core";

export type ContributionProject = {
  project: string;
  repo: string;
  repository: string;
  about: string;
  summary: string;
  featured: boolean;
  prs: GitHubPullRequest[];
  mergedCount: number;
  openCount: number;
  closedCount: number;
};

export const getGitHubContributions = cache(async () => {
  let prs: GitHubPullRequest[];
  let updatedAt = new Date().toISOString();
  let stale = false;
  try {
    prs = await fetchPublicPullRequests(githubUsername, async url => {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "bhupesh-portfolio",
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return response.json();
    }, coauthoredPullRequests, githubCreditEmails);
  } catch (error) {
    console.warn("Using saved GitHub contributions:", error instanceof Error ? error.message : "request failed");
    prs = snapshot.prs as GitHubPullRequest[];
    updatedAt = snapshot.updatedAt;
    stale = true;
  }
  const groups = new Map<string, ContributionProject>();
  for (const pr of prs) {
    let group = groups.get(pr.repository);
    if (!group) {
      const repo = `https://github.com/${pr.repository}`;
      const known = curated.find(item => item.repo.toLowerCase() === repo.toLowerCase());
      group = {
        repository: pr.repository, repo, project: known?.project ?? pr.repository,
        about: known?.about ?? "", summary: known?.summary ?? "", featured: known?.featured ?? false,
        prs: [], mergedCount: 0, openCount: 0, closedCount: 0,
      };
      groups.set(pr.repository, group);
    }
    group.prs.push(pr);
    if (pr.status === "merged") group.mergedCount++;
    else if (pr.status === "open") group.openCount++;
    else group.closedCount++;
  }
  const projects = [...groups.values()].sort((a, b) => b.mergedCount - a.mergedCount || b.prs.length - a.prs.length || a.repository.localeCompare(b.repository));
  projects.forEach(project => project.prs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  return { projects, mergedPrCount: prs.filter(pr => pr.status === "merged").length, totalPrCount: prs.length, updatedAt, stale };
});

export function projectCounts(project: ContributionProject) {
  return [
    project.mergedCount && `${project.mergedCount} merged PR${project.mergedCount === 1 ? "" : "s"}`,
    project.openCount && `${project.openCount} open PR${project.openCount === 1 ? "" : "s"}`,
    project.closedCount && `${project.closedCount} closed PR${project.closedCount === 1 ? "" : "s"} without merge`,
  ].filter(Boolean).join(" · ");
}
