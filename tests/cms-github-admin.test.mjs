import assert from "node:assert/strict";
import { test } from "node:test";
import {
  verifiedPullRequest,
  fetchCalendarSnapshot,
} from "../lib/cms/github-admin.ts";
const settings = {
  username: "RealBhupesh",
  creditEmails: ["realbhupesh@gmail.com"],
};
const url = "https://github.com/example/repository/pull/23";
const raw = {
  number: 23,
  html_url: url,
  title: "A useful fix",
  state: "closed",
  merged_at: "2026-10-01T00:00:00Z",
  created_at: "2026-09-30T00:00:00Z",
  user: { login: "RealBhupesh" },
  commits: 1,
  base: { repo: { private: false, full_name: "example/repository" } },
};
test("PR import reads actual merge state, deduplicable identity, and author from GitHub", async () => {
  const pr = await verifiedPullRequest(
    { url, mode: "verified" },
    settings,
    async () => raw,
  );
  assert.equal(pr.status, "merged");
  assert.equal(pr.number, 23);
  assert.equal(pr.attribution, undefined);
  assert.equal(pr.mergedAt, raw.merged_at);
  await assert.rejects(
    verifiedPullRequest(
      { url: "https://evil.example/pull/23", mode: "verified" },
      settings,
      async () => raw,
    ),
  );
  await assert.rejects(
    verifiedPullRequest({ url, mode: "verified" }, settings, async () => ({
      ...raw,
      base: { repo: { private: true, full_name: "example/repository" } },
    })),
  );
});
test("co-authorship needs actual commit evidence; explicit credit is separately labeled", async () => {
  const unrelated = { ...raw, user: { login: "someone" } };
  const request = async (target) =>
    target.includes("/commits?")
      ? [
          {
            html_url: "https://github.com/example/repository/commit/abc",
            commit: {
              message:
                "A fix\n\nCo-authored-by: Bhupesh <realbhupesh@gmail.com>",
            },
          },
        ]
      : unrelated;
  const verified = await verifiedPullRequest(
    { url, mode: "verified" },
    settings,
    request,
  );
  assert.equal(verified.attribution, "co-authored");
  assert.match(verified.evidence, /commit\/abc/);
  await assert.rejects(
    verifiedPullRequest({ url, mode: "verified" }, settings, async (target) =>
      target.includes("/commits?")
        ? [{ commit: { message: "Mention RealBhupesh in release notes" } }]
        : unrelated,
    ),
  );
  await assert.rejects(
    verifiedPullRequest(
      { url, mode: "credited" },
      settings,
      async () => unrelated,
    ),
  );
  const credited = await verifiedPullRequest(
    {
      url,
      mode: "credited",
      evidence: "https://github.com/example/repository/issues/22",
    },
    settings,
    async () => unrelated,
  );
  assert.equal(credited.attribution, "credited");
});
test("incomplete and stale calendars reject instead of replacing the saved graph", async () => {
  await assert.rejects(
    fetchCalendarSnapshot(settings.username, async () => ({
      contributions: [],
    })),
  );
  const now = new Date();
  const days = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(now.getTime() - (364 - i) * 86400000)
      .toISOString()
      .slice(0, 10),
    count: 1,
    level: 1,
  }));
  assert.equal(
    (
      await fetchCalendarSnapshot(settings.username, async () => ({
        contributions: days,
      }))
    ).contributions.length,
    365,
  );
  days[5] = days[4];
  await assert.rejects(
    fetchCalendarSnapshot(settings.username, async () => ({
      contributions: days,
    })),
  );
});
