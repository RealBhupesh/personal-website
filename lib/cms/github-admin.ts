import { CmsError } from "./model.ts";
import {
  creditSchema,
  pullRequestSchema,
  calendarSchema,
  type SiteContent,
} from "./site-model.ts";
import type { RequestJson } from "../github-contributions-core.ts";

export const githubRequest: RequestJson = async (url) => {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !["api.github.com", "github-contributions-api.jogruber.de"].includes(
      parsed.hostname,
    )
  )
    throw new CmsError("Unsupported GitHub data source.");
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "bhupesh-writing-studio",
      ...(parsed.hostname === "api.github.com" && process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok)
    throw new CmsError(
      res.status === 403 || res.status === 429
        ? "GitHub rate limit reached. Wait for the limit to reset, then sync again. The previous complete snapshot is preserved."
        : `GitHub data source returned ${res.status}. Retry later.`,
      502,
    );
  return res.json();
};
export async function verifiedPullRequest(
  value: unknown,
  settings: SiteContent["github"],
  request: RequestJson = githubRequest,
) {
  const credit = creditSchema.parse(value);
  const match = credit.url.match(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)$/,
  )!;
  const repo = match[1],
    api = `https://api.github.com/repos/${repo}/pulls/${match[2]}`;
  const raw = (await request(api)) as {
    number: number;
    html_url: string;
    title: string;
    state: string;
    created_at: string;
    merged_at: string | null;
    user: { login: string };
    base: { repo: { private: boolean; full_name: string } };
    commits: number;
  };
  if (
    !raw.base?.repo ||
    raw.base.repo.private ||
    raw.base.repo.full_name.toLowerCase() !== repo.toLowerCase() ||
    raw.html_url.toLowerCase() !== credit.url.toLowerCase() ||
    raw.number !== Number(match[2])
  )
    throw new CmsError("Choose a public GitHub pull request.");
  if (repo.split("/")[0].toLowerCase() === settings.username.toLowerCase())
    throw new CmsError(
      "This list tracks contributions to other people's repositories.",
    );
  let attribution: "co-authored" | "credited" | undefined,
    evidence: string | undefined;
  if (credit.mode === "credited") {
    attribution = "credited";
    evidence = credit.evidence;
  } else if (
    raw.user?.login?.toLowerCase() !== settings.username.toLowerCase()
  ) {
    if (!Number.isInteger(raw.commits) || raw.commits < 1 || raw.commits > 250)
      throw new CmsError(
        "This PR cannot be fully checked. Use explicit credit with an evidence link.",
      );
    let verified = false,
      count = 0;
    for (let page = 1; count < raw.commits; page++) {
      const commits = (await request(
        `${api}/commits?per_page=100&page=${page}`,
      )) as {
        html_url: string;
        author?: { login: string };
        commit: { message: string; author?: { email: string } };
      }[];
      if (!Array.isArray(commits) || !commits.length)
        throw new CmsError(
          "GitHub returned incomplete commit data. Retry the import.",
        );
      count += commits.length;
      for (const c of commits) {
        const trailers =
          c.commit.message
            .trim()
            .split(/\n\s*\n/)
            .at(-1) ?? "";
        const emails = settings.creditEmails.map((e) => e.toLowerCase());
        if (
          c.author?.login?.toLowerCase() === settings.username.toLowerCase() ||
          [
            ...trailers.matchAll(
              /^Co-authored-by:\s*[^<>\n]+<([^<>\n]+)>\s*$/gim,
            ),
          ].some((m) => emails.includes(m[1].toLowerCase()))
        ) {
          verified = true;
          evidence = c.html_url;
        }
      }
    }
    if (!verified)
      throw new CmsError(
        "GitHub does not identify you as the author or a co-author. Choose explicit credit and supply evidence if this contains your work.",
      );
    attribution = "co-authored";
  }
  return pullRequestSchema.parse({
    number: raw.number,
    url: raw.html_url,
    title: raw.title,
    repository: raw.base.repo.full_name,
    status: raw.merged_at ? "merged" : raw.state === "open" ? "open" : "closed",
    createdAt: raw.created_at,
    ...(raw.merged_at ? { mergedAt: raw.merged_at } : {}),
    ...(attribution ? { attribution, evidence } : {}),
  });
}
export async function fetchCalendarSnapshot(
  username: string,
  request: RequestJson = githubRequest,
) {
  const raw = (await request(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
  )) as { contributions: unknown[] };
  const parsed = calendarSchema.parse({
    username,
    updatedAt: new Date().toISOString(),
    contributions: raw.contributions,
  });
  // A valid-looking subset or duplicated dates must never replace a full calendar.
  for (let i = 1; i < parsed.contributions.length; i++)
    if (
      Date.parse(parsed.contributions[i].date) -
        Date.parse(parsed.contributions[i - 1].date) !==
      86400000
    )
      throw new CmsError(
        "The calendar is incomplete. The previous snapshot is preserved.",
        502,
      );
  if (
    Math.abs(Date.now() - Date.parse(parsed.contributions.at(-1)!.date)) >
    3 * 86400000
  )
    throw new CmsError("The calendar source is out of date. Retry later.", 502);
  return parsed;
}
