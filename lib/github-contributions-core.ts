export type GitHubPullRequest = {
  number: number;
  url: string;
  title: string;
  repository: string;
  status: "merged" | "open" | "closed";
  createdAt: string;
  attribution?: "co-authored" | "credited";
  evidence?: string;
};

export type RequestJson = (url: string) => Promise<unknown>;

type ApiPullRequest = {
  number: number;
  html_url: string;
  title: string;
  body?: string | null;
  state: string;
  created_at: string;
  pull_request?: { merged_at?: string | null };
  merged_at?: string | null;
  commits?: number;
  base?: { repo: { full_name: string; private: boolean } };
};
type ApiCommit = {
  sha: string;
  html_url: string;
  repository?: { full_name: string };
  author?: { login: string } | null;
  commit: { message: string; author?: { email: string } };
};

function normalize(item: ApiPullRequest): GitHubPullRequest {
  const match = item.html_url?.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)$/);
  if (!match || !item.title || !item.created_at || Number(match[2]) !== item.number) {
    throw new Error("Invalid GitHub pull request");
  }
  return {
    number: item.number, url: item.html_url, title: item.title,
    repository: match[1], createdAt: item.created_at,
    status: item.merged_at || item.pull_request?.merged_at ? "merged" : item.state === "open" ? "open" : "closed",
  };
}

// Both REST search endpoints cap results at 1000; partition their full history.
async function searchAll<T>(request: RequestJson, endpoint: "issues" | "commits", query: string): Promise<T[]> {
  const timestamp = (seconds: number) => new Date(seconds * 1000).toISOString().replace(".000Z", "Z");
  const date = endpoint === "issues" ? "created" : "committer-date";
  // PR bodies can contain large copied changelogs. Keep each response below
  // Next.js's 2 MB data-cache limit while preserving complete pagination.
  const pageSize = query.includes("in:body") ? 20 : 100;
  async function search(start: number, end: number): Promise<T[]> {
    const collected: T[] = [];
    let total = 0;
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({
        q: `${query} ${date}:${timestamp(start)}..${timestamp(end)}`,
        per_page: String(pageSize), page: String(page), sort: endpoint === "issues" ? "created" : "committer-date", order: "asc",
      });
      const result = await request(`https://api.github.com/search/${endpoint}?${params}`) as {
        total_count: number; incomplete_results: boolean; items: T[];
      };
      if (!result || !Number.isInteger(result.total_count) || result.incomplete_results || !Array.isArray(result.items)) {
        throw new Error("Incomplete GitHub search");
      }
      total = result.total_count;
      if (total > 1000) {
        if (start >= end) throw new Error("GitHub search exceeds the per-second limit");
        const middle = Math.floor((start + end) / 2);
        return [...await search(start, middle), ...await search(middle + 1, end)];
      }
      collected.push(...result.items);
      if (collected.length >= total) break;
      if (result.items.length < pageSize) throw new Error("Truncated GitHub search page");
    }
    const keys = collected.map(item => {
      const record = item as { html_url: string };
      if (!record.html_url) throw new Error("Invalid GitHub search result");
      return record.html_url;
    });
    if (new Set(keys).size !== total) throw new Error("GitHub results changed during pagination");
    return collected;
  }
  return search(0, Date.parse("2100-01-01T00:00:00Z") / 1000);
}

function isCreditedCommit(commit: ApiCommit, username: string, emails: string[]) {
  if (commit.author?.login?.toLowerCase() === username.toLowerCase()) return true;
  // Only real trailers at the end count, never copied release notes or mentions.
  const trailers = commit.commit.message.trim().split(/\n\s*\n/).at(-1) ?? "";
  return [...trailers.matchAll(/^Co-authored-by:\s*[^<>\n]+<([^<>\n]+)>\s*$/gim)]
    .some(match => emails.includes(match[1].toLowerCase()));
}

export async function fetchPublicPullRequests(
  username: string,
  request: RequestJson,
  coauthored: string[] = [],
  creditEmails: string[] = [],
): Promise<GitHubPullRequest[]> {
  if (!/^[\w-]+$/.test(username)) throw new Error("Invalid GitHub username");
  const publicQuery = `type:pr is:public -user:${username}`;
  const found = (await searchAll<ApiPullRequest>(request, "issues", `author:${username} ${publicQuery}`)).map(normalize);
  const byUrl = new Map(found.map(item => [item.url, item]));
  const add = (item: ApiPullRequest, attribution?: GitHubPullRequest["attribution"], evidence?: string) => {
    const pr = normalize(item);
    if (pr.repository.split("/")[0].toLowerCase() === username.toLowerCase()) return;
    if (!byUrl.has(pr.url)) byUrl.set(pr.url, { ...pr, ...(attribution ? { attribution, evidence } : {}) });
  };
  // Optional overrides retain support for credits not indexed by GitHub.
  for (const url of coauthored) {
    if (byUrl.has(url)) continue;
    const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)$/);
    if (!match) throw new Error("Invalid co-authored PR URL");
    const item = await request(`https://api.github.com/repos/${match[1]}/pulls/${match[2]}`) as ApiPullRequest;
    if (item.base?.repo.private !== false) throw new Error("Co-authored PR is not public");
    add(item, "credited", url);
  }
  if (creditEmails.length) {
    const emails = creditEmails.map(email => email.toLowerCase());
    // These two dependency bots copy release credits into unrelated PRs.
    const candidates = await searchAll<ApiPullRequest>(request, "issues", `${username} in:body ${publicQuery} -author:${username} -author:app/dependabot -author:app/renovate`);
    const source = new RegExp(`(?:https://github\\.com/)?${username}/[\\w.-]+/(?:pull|tree)/|${username}/[\\w.-]+#\\d+`, "i");
    const explicitCredit = new RegExp(`^.*credit to .*(?:@${username})(?![\\w-]).*original patches`, "im");
    for (const candidate of candidates) {
      if (byUrl.has(candidate.html_url)) continue;
      const body = candidate.body ?? "";
      const hasTrailer = isCreditedCommit({sha:"", html_url:"", commit:{message:body}}, username, emails);
      const patchCredit = explicitCredit.test(body);
      if (!source.test(body) && !hasTrailer && !patchCredit) continue;
      const pr = normalize(candidate);
      const endpoint = `https://api.github.com/repos/${pr.repository}/pulls/${pr.number}`;
      const detail = await request(endpoint) as ApiPullRequest;
      if (detail.base?.repo.private !== false) throw new Error("Credited PR is not public");
      if (!Number.isInteger(detail.commits) || detail.commits! > 250) throw new Error("Cannot verify full credited PR commit history");
      const commits: ApiCommit[] = [];
      for (let page = 1; commits.length < detail.commits!; page++) {
        const batch = await request(`${endpoint}/commits?per_page=100&page=${page}`) as ApiCommit[];
        if (!Array.isArray(batch) || batch.length === 0) throw new Error("Incomplete credited PR commits");
        commits.push(...batch);
        if (batch.length < 100 && commits.length < detail.commits!) throw new Error("Truncated credited PR commits");
      }
      if (commits.length !== detail.commits || new Set(commits.map(c => c.sha)).size !== detail.commits) throw new Error("Credited PR commits changed during pagination");
      const credit = commits.find(commit => isCreditedCommit(commit, username, emails));
      if (credit) add(detail, "co-authored", credit.html_url);
      else if (patchCredit) {
        // A maintainer can consolidate an authored patch without a co-author trailer.
        // Require both an explicit patch credit and a reference to an authored PR.
        const original = found.find(item => item.repository === pr.repository && new RegExp(`(?:#|/pull/)${item.number}(?!\\d)`).test(body));
        if (original) add(detail, "credited", original.url);
      }
    }
    // A squash commit can carry credit even when the PR body doesn't mention us.
    const commits = await searchAll<ApiCommit>(request, "commits", `"Co-authored-by" "${username}" -user:${username} is:public`);
    for (const commit of commits) {
      if (!isCreditedCommit(commit, username, emails)) continue;
      const repository = commit.repository?.full_name;
      if (!repository || repository.split("/")[0].toLowerCase() === username.toLowerCase()) continue;
      const associated = await request(`https://api.github.com/repos/${repository}/commits/${commit.sha}/pulls?per_page=100`) as ApiPullRequest[];
      if (!Array.isArray(associated) || associated.length >= 100) throw new Error("Incomplete commit PR associations");
      for (const item of associated) {
        if (item.base?.repo.private !== false) throw new Error("Associated PR is not public");
        // Ignore downstream PRs that merely contain this commit in their history.
        if (normalize(item).repository === repository) add(item, "co-authored", commit.html_url);
      }
    }
  }
  return [...byUrl.values()].filter(item => item.repository.split("/")[0].toLowerCase() !== username.toLowerCase());
}
