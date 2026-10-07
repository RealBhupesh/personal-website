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

test("discovers imported PRs automatically, verifies commit credit, and ignores mentions", async () => {
  const credited = {...pr(6930, "antiwork/gumroad"), body: "Based on https://github.com/RealBhupesh/gumroad/pull/5 by @RealBhupesh."};
  const mention = {...pr(99, "other/tool"), body: "Thanks @RealBhupesh for the report."};
  const uncredited = {...pr(100, "other/tool"), body: "Based on https://github.com/RealBhupesh/tool/pull/1"};
  const commits = [{sha: "abc", html_url: "https://github.com/antiwork/gumroad/commit/abc", commit: {message: "Port tests\n\nCo-Authored-By: RealBhupesh <realbhupesh@gmail.com>"}}];
  const items = await fetchPublicPullRequests("RealBhupesh", async url => {
    const query = new URL(url).searchParams.get("q") ?? "";
    if (url.includes("/search/commits")) return {total_count: 0, incomplete_results: false, items: []};
    if (url.includes("/search/issues")) return {total_count: query.startsWith("author:") ? 1 : 3, incomplete_results: false, items: query.startsWith("author:") ? [pr(1)] : [credited, mention, uncredited]};
    if (url.includes("/commits?")) return url.includes("gumroad") ? commits : [{sha:"other", commit:{message:"Fix"}}];
    return {...credited, merged_at: "2026-01-02T00:00:00Z", commits: 1, base: {repo: {private: false}}};
  }, [], ["realbhupesh@gmail.com"]);
  assert.deepEqual(items.map(item => item.number), [1, 6930]);
  assert.equal(items[1].attribution, "co-authored");
  assert.equal(items[1].evidence, commits[0].html_url);
});

test("co-authored squash commits find associated PRs once without inflating authored totals", async () => {
  const items = await fetchPublicPullRequests("RealBhupesh", async url => {
    if (url.includes("/search/issues")) return {total_count: 1, incomplete_results: false, items: [pr(1)]};
    if (url.includes("/search/commits")) return {total_count: 2, incomplete_results: false, items: ["a", "b"].map(sha => ({sha, html_url: `https://github.com/community/tool/commit/${sha}`, repository:{full_name:"community/tool"}, commit:{message:"Fix\n\nCo-authored-by: Bhupesh <realbhupesh@gmail.com>"}}))};
    return [{...pr(1), base:{repo:{private:false}}}, {...pr(2), merged_at:"2026-01-02T00:00:00Z", base:{repo:{private:false}}}];
  }, [], ["realbhupesh@gmail.com"]);
  assert.deepEqual(items.map(item => item.number), [1, 2]);
  assert.equal(items[1].attribution, "co-authored");
});


test("consolidated patches require explicit credit and a reference to an authored PR", async () => {
  const original = pr(9805, "makeplane/plane", "closed");
  const imported = {...pr(9841, "makeplane/plane"), body:"Supersedes #9805.\n\nCredit to @RealBhupesh for the diagnosis and the original patches."};
  const result = await fetchPublicPullRequests("RealBhupesh", async url => {
    if (url.includes("/search/commits")) return {total_count:0, incomplete_results:false,items:[]};
    if (url.includes("/search/issues")) {
      const authored = new URL(url).searchParams.get("q").startsWith("author:");
      return {total_count:1,incomplete_results:false,items:[authored ? original : imported]};
    }
    if (url.includes("/commits?")) return [{sha:"abc",commit:{message:"Fix\n\nCo-authored-by: Someone <someone@example.com>"}}];
    return {...imported,commits:1,merged_at:"2026-01-02T00:00:00Z",base:{repo:{private:false}}};
  }, [], ["realbhupesh@gmail.com"]);
  assert.equal(result[1].attribution,"credited");
  assert.equal(result[1].evidence,original.html_url);
  assert.equal(result.filter(p => p.status === "merged").length,1);
});

test("copied credits and lookalike emails do not count; incomplete discovery rejects", async () => {
  for (const message of [
    "Release notes\n\nCo-authored-by: Bhupesh <realbhupesh@gmail.com>\n\nActual change: bump a dependency",
    "Fix\n\nCo-authored-by: Bhupesh <not-realbhupesh@gmail.com>",
  ]) {
    let associations = 0;
    const result = await fetchPublicPullRequests("RealBhupesh", async url => {
      if (url.includes("/search/issues")) return {total_count:0,incomplete_results:false,items:[]};
      if (url.includes("/search/commits")) return {total_count:1,incomplete_results:false,items:[{sha:"abc",html_url:"https://github.com/other/tool/commit/abc",repository:{full_name:"other/tool"},commit:{message}}]};
      associations++;
      return [];
    }, [], ["realbhupesh@gmail.com"]);
    assert.equal(result.length,0);
    assert.equal(associations,0);
  }
  await assert.rejects(fetchPublicPullRequests("RealBhupesh", async url => ({total_count:0,incomplete_results:url.includes("/search/commits"),items:[]}), [], ["realbhupesh@gmail.com"]), /Incomplete/);
});

test("small body-search pages still discover credits after page one", async () => {
  const mentions = Array.from({length:20},(_,i)=>({...pr(i+1,"other/tool"),body:"Thanks @RealBhupesh"}));
  const imported = {...pr(6930,"antiwork/gumroad"),body:"Based on https://github.com/RealBhupesh/gumroad/pull/5"};
  const result = await fetchPublicPullRequests("RealBhupesh", async url => {
    const query = new URL(url).searchParams.get("q") ?? "";
    if (url.includes("/search/commits") || query.startsWith("author:")) return {total_count:0,incomplete_results:false,items:[]};
    if (url.includes("/search/issues")) {
      const params = new URL(url).searchParams;
      assert.equal(params.get("per_page"),"20");
      return {total_count:21,incomplete_results:false,items:params.get("page")==="1" ? mentions : [imported]};
    }
    if (url.includes("/commits?")) return [{sha:"abc",html_url:"https://github.com/antiwork/gumroad/commit/abc",commit:{message:"Fix\n\nCo-authored-by: Bhupesh <realbhupesh@gmail.com>"}}];
    return {...imported,commits:1,base:{repo:{private:false}}};
  }, [], ["realbhupesh@gmail.com"]);
  assert.deepEqual(result.map(pr=>pr.number),[6930]);
});
