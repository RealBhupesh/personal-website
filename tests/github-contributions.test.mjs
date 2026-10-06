import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPublicPullRequests } from "../lib/github-contributions-core.ts";

const pr = (number, repo = "community/tool", status = "merged") => ({
  number, title: `Fix ${number}`, html_url: `https://github.com/${repo}/pull/${number}`,
  repository_url: `https://api.github.com/repos/${repo}`,
  state: status === "open" ? "open" : "closed", created_at: "2026-01-01T00:00:00Z",
  pull_request: { merged_at: status === "merged" ? "2026-01-02T00:00:00Z" : null },
});

test("new repositories and PRs beyond the first page appear with their actual status", async () => {
  const pages = [Array.from({length: 100}, (_, i) => pr(i + 1)), [
    pr(101, "new/project", "open"), pr(102, "another/project", "closed"),
    pr(103, "RealBhupesh/own-repo"),
  ]];
  const items = await fetchPublicPullRequests("RealBhupesh", async (url) => ({
    total_count: 103, incomplete_results: false,
    items: pages[Number(new URL(url).searchParams.get("page")) - 1],
  }));
  assert.equal(items.length, 102);
  assert.equal(items.find(p => p.repository === "new/project").status, "open");
  assert.equal(items.find(p => p.repository === "another/project").status, "closed");
  assert.equal(items.filter(p => p.status === "merged").length, 100);
});

test("co-authored PRs are retained once and verified using GitHub's merge state", async () => {
  const items = await fetchPublicPullRequests("RealBhupesh", async url => {
    if (url.includes("/search/")) return {total_count: 1, incomplete_results: false, items: [pr(1)]};
    return {...pr(2, "other/tool"), merged_at: "2026-01-02T00:00:00Z", base: {repo: {full_name: "other/tool", private: false}}};
  }, ["https://github.com/community/tool/pull/1", "https://github.com/other/tool/pull/2"]);
  assert.equal(items.length, 2);
  assert.equal(items.find(p => p.repository === "other/tool").status, "merged");
});

test("incomplete or truncated pages fail instead of replacing the last complete snapshot", async () => {
  await assert.rejects(fetchPublicPullRequests("RealBhupesh", async () => ({
    total_count: 200, incomplete_results: false, items: [pr(1)],
  })));
  await assert.rejects(fetchPublicPullRequests("RealBhupesh", async () => ({
    total_count: 1, incomplete_results: true, items: [pr(1)],
  })));
});

test("searches over GitHub's 1000-result ceiling split into disjoint date ranges", async () => {
  const items = await fetchPublicPullRequests("RealBhupesh", async url => {
    const params = new URL(url).searchParams;
    const range = params.get("q").match(/created:([^ ]+)/)[1];
    if (range.startsWith("1970") && range.includes("2100")) {
      return {total_count: 1001, incomplete_results: false, items: [pr(1)]};
    }
    return {total_count: 1, incomplete_results: false, items: [
      pr(range.startsWith("1970") ? 1 : 2),
    ]};
  });
  assert.deepEqual(items.map(p => p.number).sort(), [1, 2]);
});
