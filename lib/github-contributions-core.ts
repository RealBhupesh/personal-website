export type GitHubPullRequest = {
  number: number;
  url: string;
  title: string;
  repository: string;
  status: "merged" | "open" | "closed";
  createdAt: string;
};

export type RequestJson = (url: string) => Promise<unknown>;

type ApiPullRequest = {
  number: number;
  html_url: string;
  title: string;
  repository_url?: string;
  state: string;
  created_at: string;
  pull_request?: { merged_at?: string | null };
  merged_at?: string | null;
  base?: { repo: { full_name: string; private: boolean } };
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

export async function fetchPublicPullRequests(
  username: string,
  request: RequestJson,
  coauthored: string[] = [],
): Promise<GitHubPullRequest[]> {
  if (!/^[\w-]+$/.test(username)) throw new Error("Invalid GitHub username");
  const baseQuery = `author:${username} type:pr is:public -user:${username}`;
  const timestamp = (seconds: number) => new Date(seconds * 1000).toISOString().replace(".000Z", "Z");
  async function search(start: number, end: number): Promise<GitHubPullRequest[]> {
    const collected: GitHubPullRequest[] = [];
    let total = 0;
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({
        q: `${baseQuery} created:${timestamp(start)}..${timestamp(end)}`,
        per_page: "100", page: String(page), sort: "created", order: "asc",
      });
      const result = await request(`https://api.github.com/search/issues?${params}`) as {
        total_count: number; incomplete_results: boolean; items: ApiPullRequest[];
      };
      if (!result || !Number.isInteger(result.total_count) || result.incomplete_results || !Array.isArray(result.items)) {
        throw new Error("Incomplete GitHub search");
      }
      total = result.total_count;
      // GitHub caps each search at 1000. Split instead of silently dropping older PRs.
      if (total > 1000) {
        if (start >= end) throw new Error("GitHub search exceeds the per-second limit");
        const middle = Math.floor((start + end) / 2);
        return [...await search(start, middle), ...await search(middle + 1, end)];
      }
      collected.push(...result.items.map(normalize));
      if (collected.length >= total) break;
      if (result.items.length < 100) throw new Error("Truncated GitHub search page");
    }
    if (new Set(collected.map(p => p.url)).size !== total) throw new Error("GitHub results changed during pagination");
    return collected;
  }
  const found = await search(0, Date.parse("2100-01-01T00:00:00Z") / 1000);
  const byUrl = new Map(found.map(item => [item.url, item]));
  // Search finds authored PRs; explicitly credited co-authored work needs a direct lookup.
  for (const url of coauthored) {
    if (byUrl.has(url)) continue;
    const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)$/);
    if (!match) throw new Error("Invalid co-authored PR URL");
    const item = await request(`https://api.github.com/repos/${match[1]}/pulls/${match[2]}`) as ApiPullRequest;
    if (item.base?.repo.private !== false) throw new Error("Co-authored PR is not public");
    byUrl.set(url, normalize(item));
  }
  return [...byUrl.values()].filter(item => item.repository.split("/")[0].toLowerCase() !== username.toLowerCase());
}
