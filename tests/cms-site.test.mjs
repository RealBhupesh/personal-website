import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { SiteService } from "../lib/cms/site-service.ts";
import { siteContentSchema } from "../lib/cms/site-model.ts";
import { digest, CmsError } from "../lib/cms/model.ts";
const initial = JSON.parse(
  readFileSync(new URL("../data/site-content.json", import.meta.url)),
);
class Repo {
  files = new Map();
  commits = 0;
  failWrite = false;
  changes = [];
  async read(p) {
    const content = this.files.get(p);
    return content === undefined ? null : { content, sha: digest(content) };
  }
  async write(p, c, e) {
    if (this.failWrite) throw Error("offline");
    assert.equal((await this.read(p))?.sha ?? null, e);
    this.files.set(p, c);
    return digest(c);
  }
  async head() {
    return String(this.commits);
  }
  async publish(changes, head) {
    assert.equal(head, String(this.commits));
    this.changes = changes;
    for (const c of changes)
      if (c.content === null) this.files.delete(c.path);
      else this.files.set(c.path, c.content);
    return String(++this.commits);
  }
  async history() {
    return [];
  }
}
function setup() {
  const a = new Repo(),
    b = new Repo();
  b.files.set(
    "data/site-content.json",
    JSON.stringify(initial, null, 2) + "\n",
  );
  return { a, b, s: new SiteService(a, b) };
}
test("existing CMS drafts accept new search settings with safe empty defaults", () => {
  const legacy = structuredClone(initial);
  delete legacy.site.googleVerification;
  delete legacy.site.bingVerification;
  for (const page of ['about', 'work', 'blog', 'notes']) delete legacy.pages[page].seoTitle;
  const parsed = siteContentSchema.parse(legacy);
  assert.equal(parsed.site.googleVerification, '');
  assert.equal(parsed.site.bingVerification, '');
  assert.equal(parsed.pages.about.seoTitle, '');
  assert.equal(parsed.site.name, initial.site.name);
});
test("site schema rejects duplicate projects, missing groups, dangling selections and unsafe URLs", () => {
  for (const mutate of [
    (x) => x.work.projects.push(x.work.projects[0]),
    (x) => (x.work.projects[0].group = "missing"),
    (x) => x.work.selected.push("missing"),
    (x) => (x.site.github = "javascript:alert(1)"),
    (x) => (x.images.portrait.src = "/../secret.png"),
    (x) => (x.site.navigation[0].href = "/api/cms/posts"),
  ]) {
    const copy = structuredClone(initial);
    mutate(copy);
    assert.throws(() => siteContentSchema.parse(copy));
  }
  const empty = structuredClone(initial);
  empty.work.projects = [];
  empty.work.selected = [];
  empty.images.tech = [];
  empty.experience.roles = [];
  assert.doesNotThrow(() => siteContentSchema.parse(empty));
});
test("site changes stay private, reject stale writes and publish only after review", async () => {
  const { a, b, s } = setup();
  const start = await s.get();
  const next = structuredClone(start.draft.content);
  next.site.name = "New name";
  const saved = await s.save(next, start.revision);
  assert.equal(
    JSON.parse(b.files.get("data/site-content.json")).site.name,
    initial.site.name,
  );
  assert.ok(saved.changes.includes("site.name"));
  await assert.rejects(s.save(next, start.revision));
  const live = await s.publish(saved.revision);
  assert.equal(
    JSON.parse(b.files.get("data/site-content.json")).site.name,
    "New name",
  );
  assert.equal(live.changes.length, 0);
  assert.ok(a.files.size);
});
test("external public edits conflict; successful publication reconciles private bookkeeping failure", async () => {
  const { a, b, s } = setup();
  const start = await s.get();
  const c = structuredClone(start.draft.content);
  c.site.name = "Private";
  const saved = await s.save(c, start.revision);
  b.files.set(
    "data/site-content.json",
    JSON.stringify({
      ...initial,
      profile: { ...initial.profile, location: "Elsewhere" },
    }),
  );
  await assert.rejects(
    s.publish(saved.revision),
    (e) => e instanceof CmsError && e.status === 409,
  );
  b.files.set(
    "data/site-content.json",
    JSON.stringify(initial, null, 2) + "\n",
  );
  a.failWrite = true;
  await assert.rejects(s.publish(saved.revision));
  assert.equal(b.commits, 1);
  a.failWrite = false;
  await s.publish(saved.revision);
  assert.equal(b.commits, 1);
});
test("import cannot forge publication state or change the canonical host", async () => {
  const { s } = setup();
  const start = await s.get();
  const c = structuredClone(start.draft.content);
  c.site.url = "https://attacker.example";
  await assert.rejects(s.save(c, start.revision));
  await assert.rejects(
    s.save({ ...start.draft, published: { commit: "forged" } }, start.revision),
  );
});
test("failed GitHub sync preserves complete PR data and reports last attempt", async () => {
  const { s } = setup();
  const start = await s.get();
  const saved = await s.sync("prs", start.revision, async () => {
    throw Error("rate limit");
  });
  assert.match(saved.draft.sync.prs.error, /rate limit/);
  assert.equal(saved.draft.prs, undefined);
  assert.ok(saved.draft.sync.prs.attemptedAt);
});

test("the first draft refuses an out-of-date public revision", async () => {
  const { b, s } = setup();
  const first = await s.get();
  const outside = structuredClone(initial);
  outside.profile.location = "Outside change";
  b.files.set(
    "data/site-content.json",
    JSON.stringify(outside, null, 2) + "\n",
  );
  await assert.rejects(
    s.save(first.draft.content, first.revision),
    (e) => e.status === 409,
  );
  assert.equal((await s.get()).live.profile.location, "Outside change");
});
test("site publication includes actual image references atomically and ignores paths quoted in prose", async () => {
  const { a, b, s } = setup();
  a.files.set(
    "media/actual-image.json",
    JSON.stringify({
      id: "actual-image",
      name: "Actual image",
      mime: "image/png",
      alt: "A real image",
      caption: "",
      createdAt: new Date().toISOString(),
      path: "media/actual-image.png",
    }),
  );
  a.files.set("media/actual-image.data", "cG5n");
  const start = await s.get(),
    c = structuredClone(start.draft.content);
  c.images.portrait.src = "/uploads/cms/actual-image.png";
  c.site.bio += " An example path: /uploads/cms/private-example.png";
  const saved = await s.save(c, start.revision);
  await s.publish(saved.revision);
  assert.equal(b.commits, 1);
  assert.ok(
    b.changes.some(
      (x) =>
        x.path === "public/uploads/cms/actual-image.png" &&
        x.encoding === "base64",
    ),
  );
  assert.ok(!b.changes.some((x) => x.path.includes("private-example")));
});

test("failed refresh retains an existing complete snapshot and previous success metadata", async () => {
  const { a, s } = setup(),
    start = await s.get();
  const prior = {
    ...start.draft,
    prs: {
      username: "RealBhupesh",
      updatedAt: "2026-10-01T00:00:00Z",
      prs: [
        {
          url: "https://github.com/example/repo/pull/1",
          number: 1,
          repository: "example/repo",
          title: "Real work",
          status: "merged",
          createdAt: "2026-09-01",
        },
      ],
    },
    sync: {
      prs: {
        attemptedAt: "2026-10-01T00:00:00Z",
        successAt: "2026-10-01T00:00:00Z",
        count: 1,
      },
    },
  };
  await a.write("website/content.json", JSON.stringify(prior), null);
  const saved = await s.get();
  const result = await s.sync("prs", saved.revision, async () => ({
    incomplete_results: true,
  }));
  assert.deepEqual(result.draft.prs, prior.prs);
  assert.equal(result.draft.sync.prs.successAt, prior.sync.prs.successAt);
  assert.match(result.draft.sync.prs.error, /Incomplete/);
});
