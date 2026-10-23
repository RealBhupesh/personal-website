import { CmsError, digest } from "./model.ts";
export type StoredFile = { content: string; sha: string };
export type Change = {
  path: string;
  content: string | null;
  encoding?: "utf-8" | "base64";
};
export type Revision = { id: string; date: string; message: string };
export interface Repository {
  read(path: string, ref?: string): Promise<StoredFile | null>;
  list(prefix: string): Promise<string[]>;
  write(
    path: string,
    content: string,
    expected: string | null,
    message: string,
  ): Promise<string>;
  history(path: string): Promise<Revision[]>;
  publish(
    changes: Change[],
    expectedHead: string,
    message: string,
  ): Promise<string>;
  head(): Promise<string>;
  status(commit: string): Promise<{ state: string; url?: string }>;
}
export type GitRequest = <T>(
  path: string,
  method?: string,
  body?: unknown,
) => Promise<T>;
export function checkPath(path: string) {
  if (
    !/^[a-zA-Z0-9_./-]+$/.test(path) ||
    path.split("/").some((p) => !p || p === "." || p === "..") ||
    path.startsWith("/")
  )
    throw new CmsError("Invalid content path.");
}
export class GitHubRepository implements Repository {
  readonly repo: string;
  readonly branch: string;
  readonly request: GitRequest;
  constructor(repo: string, branch: string, request: GitRequest) {
    this.repo = repo;
    this.branch = branch;
    this.request = request;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w/-]+$/.test(branch))
      throw new CmsError("Invalid repository configuration.", 503);
  }
  api(path: string) {
    return `/repos/${this.repo}/${path}`;
  }
  async read(path: string, ref = this.branch) {
    checkPath(path);
    try {
      const file = await this.request<{
        content: string;
        encoding: string;
        sha: string;
      }>(this.api(`contents/${path}?ref=${encodeURIComponent(ref)}`));
      const data =
        file.encoding === "base64"
          ? file
          : await this.request<{ content: string; encoding: string }>(
              this.api(`git/blobs/${file.sha}`),
            );
      if (data.encoding !== "base64")
        throw new CmsError(
          "GitHub could not return this file's contents.",
          502,
        );
      return {
        content: Buffer.from(data.content, "base64").toString("utf8"),
        sha: file.sha,
      };
    } catch (error) {
      if (error instanceof CmsError && error.status === 404) return null;
      throw error;
    }
  }
  async list(prefix: string) {
    checkPath(prefix);
    const tree = await this.request<{
      truncated: boolean;
      tree: { path: string; type: string }[];
    }>(this.api(`git/trees/${encodeURIComponent(this.branch)}?recursive=1`));
    if (tree.truncated)
      throw new CmsError(
        "Repository listing is incomplete. Try a smaller content repository.",
        502,
      );
    return tree.tree
      .filter((f) => f.type === "blob" && f.path.startsWith(`${prefix}/`))
      .map((f) => f.path);
  }
  async write(
    path: string,
    content: string,
    expected: string | null,
    message: string,
  ) {
    checkPath(path);
    const current = await this.read(path);
    if ((current?.sha ?? null) !== expected)
      throw new CmsError(
        "This draft changed in another window. Reload the saved version or export your text before continuing.",
        409,
      );
    const result = await this.request<{ content: { sha: string } }>(
      this.api(`contents/${path}`),
      "PUT",
      {
        message,
        content: Buffer.from(content).toString("base64"),
        branch: this.branch,
        ...(expected ? { sha: expected } : {}),
      },
    );
    return result.content.sha;
  }
  async history(path: string) {
    checkPath(path);
    const items = await this.request<
      { sha: string; commit: { message: string; author: { date: string } } }[]
    >(
      this.api(
        `commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(this.branch)}&per_page=30`,
      ),
    );
    return items.map((c) => ({
      id: c.sha,
      date: c.commit.author.date,
      message: c.commit.message.split("\n")[0],
    }));
  }
  async head() {
    const ref = await this.request<{ object: { sha: string } }>(
      this.api(`git/ref/heads/${this.branch}`),
    );
    return ref.object.sha;
  }
  async publish(changes: Change[], expectedHead: string, message: string) {
    if ((await this.head()) !== expectedHead)
      throw new CmsError(
        "The website changed during publication. Retry to check the latest version.",
        409,
      );
    const parent = await this.request<{ tree: { sha: string } }>(
      this.api(`git/commits/${expectedHead}`),
    );
    const tree = [];
    for (const change of changes) {
      checkPath(change.path);
      if (change.content === null) {
        tree.push({
          path: change.path,
          mode: "100644",
          type: "blob",
          sha: null,
        });
        continue;
      }
      const blob = await this.request<{ sha: string }>(
        this.api("git/blobs"),
        "POST",
        { content: change.content, encoding: change.encoding ?? "utf-8" },
      );
      tree.push({
        path: change.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }
    const built = await this.request<{ sha: string }>(
      this.api("git/trees"),
      "POST",
      { base_tree: parent.tree.sha, tree },
    );
    const commit = await this.request<{ sha: string }>(
      this.api("git/commits"),
      "POST",
      { message, tree: built.sha, parents: [expectedHead] },
    );
    // Never force the branch: an intervening commit must produce a conflict.
    await this.request(this.api(`git/refs/heads/${this.branch}`), "PATCH", {
      sha: commit.sha,
      force: false,
    });
    return commit.sha;
  }
  async status(commit: string) {
    const result = await this.request<{
      state: string;
      statuses: { state: string; target_url?: string }[];
    }>(this.api(`commits/${commit}/status`));
    const states = result.statuses;
    return {
      state: states.length ? result.state : "pending",
      url: states.find((s) => s.target_url)?.target_url,
    };
  }
}
export const jsonFile = (value: unknown) =>
  JSON.stringify(value, null, 2) + "\n";
export const revisionOf = (value: unknown) => digest(jsonFile(value));
