import assert from "node:assert/strict";
import { readFile, unlink, readdir } from "node:fs/promises";
import { request as httpRequest } from "node:http";
const base = process.env.CMS_TEST_URL ?? "http://127.0.0.1:3000";
assert.match(
  base,
  /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
  "HTTP smoke checks must use the explicit local workspace",
);
const ids = [];
const mediaIds = [];
const publicAssets = [];
let publishedPath;
async function call(path, method = "GET", data, headers = {}) {
  const response = await fetch(`${base}/api/cms/${path}`, {
    method,
    headers: {
      Origin: base,
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
try {
  assert.equal(
    (
      await call(
        "posts",
        "POST",
        { template: "blank" },
        { Origin: "https://example.invalid" },
      )
    ).status,
    403,
  );
  const badHost = await new Promise((resolve, reject) => {
    const req = httpRequest(
      `${base}/api/cms/posts`,
      { headers: { Host: "example.invalid" } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(badHost, 503);
  let result = await call("posts", "POST", { template: "tutorial" });
  assert.equal(result.status, 201);
  let entry = result.data;
  ids.push(entry.article.id);
  const slug = `cms-check-${entry.article.id}`;
  const imageData =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yFa0AAAAASUVORK5CYII=";
  const upload = await call("media", "POST", {
    name: "cms-test.png",
    mime: "image/png",
    base64: imageData,
    alt: "A test pixel",
    caption: "A temporary test image",
  });
  assert.equal(upload.status, 201);
  mediaIds.push(upload.data.id);
  const privateImage = await fetch(`${base}/api/cms/media/${upload.data.id}`);
  assert.equal(privateImage.status, 200);
  assert.match(privateImage.headers.get("cache-control"), /private/);
  const describe = await call(`media/${upload.data.id}`, "PUT", {
    alt: "A described pixel",
    caption: "Test caption",
  });
  assert.equal(describe.status, 200);
  const mediaList = await call("media");
  assert.ok(
    mediaList.data.some(
      (image) =>
        image.id === upload.data.id && image.alt === "A described pixel",
    ),
  );
  assert.ok(!JSON.stringify(mediaList.data).includes(imageData));
  const asset = `/uploads/cms/${upload.data.path.split("/").at(-1)}`;
  assert.equal((await fetch(`${base}${asset}`)).status, 404);

  result = await call(`posts/${entry.article.id}`, "PUT", {
    article: {
      ...entry.article,
      title: "CMS integration check",
      description: "An unpublished test of the content workflow.",
      slug,
      body:
        "## A working draft\n\nSaved privately, then published locally.\n\n```ts\nconst value = { count: 1 };\n```\n\n![A described pixel](" +
        asset +
        ")",
    },
    revision: entry.revision,
  });
  assert.equal(result.status, 200);
  entry = result.data;
  const publicBefore = await fetch(`${base}/blog/${slug}`);
  assert.equal(publicBefore.status, 404);
  assert.equal(
    (
      await call(`posts/${entry.article.id}`, "PUT", {
        article: entry.article,
        revision: "stale",
      })
    ).status,
    409,
  );
  const history = await call(`posts/${entry.article.id}/history`);
  assert.equal(history.status, 200);
  assert.ok(history.data.length >= 2);
  const previous = await call(
    `posts/${entry.article.id}?ref=${history.data.at(-1).id}`,
  );
  assert.equal(previous.status, 200);
  assert.equal(previous.data.article.title, "");
  const imported = await call("import", "POST", {});
  assert.equal(imported.status, 200);
  result = await call(`posts/${entry.article.id}/publish`, "POST", {
    revision: entry.revision,
  });
  assert.equal(result.status, 200);
  entry = result.data;
  publishedPath = `content/blog/${slug}.mdx`;
  assert.equal(entry.state, "published");
  assert.equal(entry.article.published.commit, "local");
  publicAssets.push(`public${asset}`);
  assert.equal((await fetch(`${base}${asset}`)).status, 200);
  const live = await fetch(`${base}/blog/${slug}`);
  assert.equal(live.status, 200);
  assert.match(await live.text(), /CMS integration check/);
  const source = await readFile(publishedPath, "utf8");
  assert.match(source, /draft: false/);
  result = await call(`posts/${entry.article.id}`, "PUT", {
    article: {
      ...entry.article,
      body: "A private edit that must not be live.",
    },
    revision: entry.revision,
  });
  assert.equal(result.status, 200);
  entry = result.data;
  assert.equal(await readFile(publishedPath, "utf8"), source);
  assert.equal(entry.state, "changes");
  const dup = await call(`posts/${entry.article.id}/duplicate`, "POST", {});
  assert.equal(dup.status, 201);
  ids.push(dup.data.article.id);
  assert.equal(dup.data.article.published, undefined);
  result = await call(`posts/${entry.article.id}/unpublish`, "POST", {
    revision: entry.revision,
  });
  assert.equal(result.status, 200);
  entry = result.data;
  assert.equal(entry.state, "draft");
  assert.equal((await fetch(`${base}/blog/${slug}`)).status, 404);
  result = await call(`posts/${entry.article.id}`, "PUT", {
    article: { ...entry.article, archived: true },
    revision: entry.revision,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.state, "archived");
  console.log(
    "PASS: origin/host protection, create, private draft visibility, save/reload, stale revision, history, import, private image upload/metadata, referenced asset publication, publish, staged edits, duplicate, unpublish, archive.",
  );
} finally {
  if (publishedPath) await unlink(publishedPath).catch(() => {});
  for (const path of publicAssets) await unlink(path).catch(() => {});
  for (const id of mediaIds)
    for (const ext of ["json", "data"])
      await unlink(`.cms/media/${id}.${ext}`).catch(() => {});
  for (const id of ids)
    await unlink(`.cms/articles/${id}.json`).catch(() => {});
  // Remove only test-owned revision files; preserve imported articles and all other writing.
  for (const ref of await readdir(".cms/.history").catch(() => [])) {
    const folder = `.cms/.history/${ref}`;
    const meta = JSON.parse(
      await readFile(`${folder}/meta.json`, "utf8").catch(() => "null"),
    );
    if (
      meta &&
      (ids.some((id) => meta.path === `articles/${id}.json`) ||
        mediaIds.some((id) => meta.path === `media/${id}.json`))
    ) {
      const { rm } = await import("node:fs/promises");
      await rm(folder, { recursive: true });
    }
  }
}
