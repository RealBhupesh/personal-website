import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { CmsService } from "../lib/cms/service.ts";
import { GitHubRepository } from "../lib/cms/repository.ts";
import {
  articleState,
  validateBody,
  validatePublication,
  importArticle,
  serializeArticle,
  digest,
  referencedMedia,
  CmsError,
} from "../lib/cms/model.ts";
import { cmsConfig, isLoopbackHost } from "../lib/cms/config.ts";
class MemoryRepo {
  files = new Map();
  changes = [];
  commits = 0;
  failWrite = false;
  versions = new Map();
  async read(path, ref) {
    if (ref) return this.versions.get(ref)?.get(path) ?? null;
    const content = this.files.get(path);
    return content === undefined ? null : { content, sha: digest(content) };
  }
  async list(prefix) {
    return [...this.files.keys()].filter((p) => p.startsWith(`${prefix}/`));
  }
  async write(path, content, expected) {
    if (this.failWrite) throw new Error("store unavailable");
    const file = await this.read(path);
    if ((file?.sha ?? null) !== expected) throw new CmsError("conflict", 409);
    this.files.set(path, content);
    return digest(content);
  }
  async head() {
    return String(this.commits);
  }
  async publish(changes, head) {
    assert.equal(head, String(this.commits));
    this.changes = changes;
    for (const c of changes) {
      if (c.content === null) this.files.delete(c.path);
      else this.files.set(c.path, c.content);
    }
    this.commits++;
    return String(this.commits);
  }
  async history() {
    return [];
  }
}
async function draft(service) {
  let entry = await service.create("blank");
  return service.save(
    {
      ...entry.article,
      title: "A useful question",
      description: "What a small experiment taught me.",
      slug: "a-useful-question",
      body: "## The experiment\n\nA real paragraph.",
    },
    entry.revision,
  );
}

test("draft saves stay private and stale writes preserve the saved version", async () => {
  const privateRepo = new MemoryRepo();
  const publicRepo = new MemoryRepo();
  const cms = new CmsService(privateRepo, publicRepo);
  const entry = await draft(cms);
  const saved = await cms.save(
    { ...entry.article, body: "Updated" },
    entry.revision,
  );
  await assert.rejects(
    cms.save({ ...entry.article, body: "Stale" }, entry.revision),
    (e) => e.status === 409,
  );
  assert.equal((await cms.get(entry.article.id)).article.body, "Updated");
  assert.equal(publicRepo.files.size, 0);
  assert.equal(articleState(saved.article), "draft");
});
test("publication is atomic, staged edits stay private, and unpublish retains the source", async () => {
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  const draftEntry = await draft(cms);
  const published = await cms.publish(
    draftEntry.article.id,
    draftEntry.revision,
  );
  assert.equal(articleState(published.article), "published");
  assert.equal(b.commits, 1);
  const live = b.files.get("content/blog/a-useful-question.mdx");
  assert.match(live, /draft: false/);
  const edit = await cms.save(
    { ...published.article, body: "A private revision" },
    published.revision,
  );
  assert.equal(articleState(edit.article), "changes");
  assert.equal(b.files.get("content/blog/a-useful-question.mdx"), live);
  const removed = await cms.unpublish(edit.article.id, edit.revision);
  assert.equal(articleState(removed.article), "draft");
  assert.equal(b.files.size, 0);
  assert.equal(removed.article.body, "A private revision");
});
test("retries reconcile a public commit when private bookkeeping failed", async () => {
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  const entry = await draft(cms);
  a.failWrite = true;
  await assert.rejects(
    cms.publish(entry.article.id, entry.revision),
    /unavailable/,
  );
  assert.equal(b.commits, 1);
  a.failWrite = false;
  const reconciled = await cms.publish(entry.article.id, entry.revision);
  assert.equal(b.commits, 1);
  assert.equal(articleState(reconciled.article), "published");
});
test("publishing refuses collisions, outside edits, future dates, and unsafe MDX", async () => {
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  const entry = await draft(cms);
  b.files.set("content/blog/a-useful-question.mdx", "Somebody else's file");
  await assert.rejects(
    cms.publish(entry.article.id, entry.revision),
    (e) => e.status === 409,
  );
  for (const body of [
    "{process.env.AUTH_SECRET}",
    "import fs from 'node:fs'\n\nhello",
    "<script>alert(1)</script>",
    "<Figure src={process.env.AUTH_SECRET} />",
    "[bad](javascript:alert%281%29)",
  ]) {
    assert.throws(() => validateBody(body));
  }
  assert.throws(
    () => validatePublication({ ...entry.article, date: "2099-01-01" }),
    /Future/,
  );
  assert.doesNotThrow(() =>
    validateBody("```js\nconst x = { safe: true };\n```"),
  );
});
test("existing essay imports without losing diagrams, code, or its published URL", async () => {
  const source = await readFile(
    new URL("../content/blog/jostraca-second-run.mdx", import.meta.url),
    "utf8",
  );
  const imported = importArticle("jostraca-second-run", source, "original-sha");
  assert.doesNotThrow(() => validatePublication(imported));
  assert.match(imported.body, /<JostracaDiagram kind="proposed-default" \/>/);
  assert.match(serializeArticle(imported), /```ts/);
  assert.equal(imported.published.slug, "jostraca-second-run");
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  b.files.set("content/blog/jostraca-second-run.mdx", source);
  assert.equal((await cms.importExisting()).count, 1);
  assert.equal((await cms.importExisting()).count, 0);
});
test("only referenced media are published and MIME spoofing is rejected", async () => {
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  const entry = await draft(cms);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yFa0AAAAASUVORK5CYII=",
    "base64",
  );
  const used = await cms.upload(
    "used.png",
    "image/png",
    png,
    "An explanation",
    "",
  );
  await cms.upload("unused.png", "image/png", png, "Not used", "");
  await assert.rejects(
    cms.upload(
      "fake.png",
      "image/png",
      Buffer.from("<script>not an image</script>"),
      "",
      "",
    ),
    /contents/,
  );
  const saved = await cms.save(
    {
      ...entry.article,
      body: `![An explanation](/uploads/cms/${used.path.split("/").at(-1)})`,
    },
    entry.revision,
  );
  await cms.publish(saved.article.id, saved.revision);
  assert.equal(b.changes.length, 2);
  assert.equal(b.changes[1].encoding, "base64");
  assert.match(b.changes[1].path, /public\/uploads\/cms/);
  assert.ok(!b.changes.some((c) => c.path.startsWith("articles/")));
});
test("publication metadata cannot be forged and published URLs cannot be changed", async () => {
  const cms = new CmsService(new MemoryRepo(), new MemoryRepo());
  let entry = await draft(cms);
  entry = await cms.save(
    {
      ...entry.article,
      published: {
        slug: entry.article.slug,
        digest: "fake",
        sourceSha: "fake",
        commit: "fake",
        at: "fake",
      },
    },
    entry.revision,
  );
  assert.equal(entry.article.published, undefined);
  entry = await cms.publish(entry.article.id, entry.revision);
  await assert.rejects(
    cms.save({ ...entry.article, slug: "broken-links" }, entry.revision),
    /locked/,
  );
  await assert.rejects(
    cms.save({ ...entry.article, archived: true }, entry.revision),
    /Unpublish/,
  );
});
test("GitHub publication uses one commit and refuses a concurrent branch update", async () => {
  const calls = [];
  const request = async (path, method = "GET", body) => {
    calls.push({ path, method, body });
    if (path.includes("git/ref/heads")) return { object: { sha: "head" } };
    if (path.endsWith("git/commits/head")) return { tree: { sha: "base" } };
    if (path.endsWith("git/blobs")) return { sha: "blob" };
    if (path.endsWith("git/trees")) return { sha: "tree" };
    if (method === "POST") return { sha: "commit" };
    if (method === "PATCH") assert.equal(body.force, false);
    return {};
  };
  const repo = new GitHubRepository(
    "RealBhupesh/personal-website",
    "main",
    request,
  );
  await repo.publish(
    [
      { path: "content/blog/test.mdx", content: "post" },
      {
        path: "public/uploads/cms/image.png",
        content: "abc",
        encoding: "base64",
      },
    ],
    "head",
    "Publish",
  );
  assert.equal(calls.filter((c) => c.method === "PATCH").length, 1);
  assert.equal(
    calls.find((c) => c.path.endsWith("git/commits") && c.method === "POST")
      .body.parents[0],
    "head",
  );
  await assert.rejects(
    repo.publish([], "stale", "Publish"),
    (e) => e.status === 409,
  );
});
test("local mode is disabled in production and accepts only loopback hosts", () => {
  const node = process.env.NODE_ENV,
    local = process.env.CMS_LOCAL_MODE;
  try {
    process.env.NODE_ENV = "production";
    process.env.CMS_LOCAL_MODE = "true";
    assert.equal(cmsConfig().local, false);
  } finally {
    if (node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = node;
    if (local === undefined) delete process.env.CMS_LOCAL_MODE;
    else process.env.CMS_LOCAL_MODE = local;
  }
  assert.equal(isLoopbackHost("localhost:3000"), true);
  for (const host of [
    "evil.example",
    "localhost.evil.example",
    "127.0.0.1.evil",
    "www.bhupeshcholake.in",
  ])
    assert.equal(isLoopbackHost(host), false);
});

test("code examples do not accidentally publish private media", () => {
  const article = importArticle(
    "test",
    "---\ntitle: Test\ndescription: Test\ndate: '2026-10-01'\n---\n\n```md\n![sample](/uploads/cms/private.png)\n```\n\n![real](/uploads/cms/real.png)",
    "sha",
  );
  assert.deepEqual(referencedMedia(article), ["/uploads/cms/real.png"]);
});

test("large private media use Git blobs instead of GitHub's 1 MB contents limit", async () => {
  const repo = new GitHubRepository(
    "RealBhupesh/website-writing",
    "main",
    async (path) =>
      path.includes("/contents/")
        ? { sha: "blob", encoding: "none", content: "" }
        : {
            encoding: "base64",
            content: Buffer.from("large media payload").toString("base64"),
          },
  );
  assert.deepEqual(await repo.read("media/image.data"), {
    sha: "blob",
    content: "large media payload",
  });
});

test("an updated post's reconciliation follows the new deployment, not its old commit", async () => {
  const a = new MemoryRepo(),
    b = new MemoryRepo(),
    cms = new CmsService(a, b);
  let entry = await draft(cms);
  entry = await cms.publish(entry.article.id, entry.revision);
  entry = await cms.save(
    { ...entry.article, body: "An updated piece." },
    entry.revision,
  );
  a.failWrite = true;
  await assert.rejects(cms.publish(entry.article.id, entry.revision));
  a.failWrite = false;
  const reconciled = await cms.publish(entry.article.id, entry.revision);
  assert.equal(b.commits, 2);
  assert.equal(reconciled.article.published.commit, "2");
});
