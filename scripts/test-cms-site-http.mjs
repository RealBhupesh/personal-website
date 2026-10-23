import assert from "node:assert/strict";
import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
const base = process.env.CMS_TEST_URL ?? "http://127.0.0.1:3101";
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const publicPath = "data/site-content.json",
  privatePath = ".cms/website/content.json";
const before = await readFile(publicPath);
let privateBefore = null;
try {
  privateBefore = await readFile(privatePath);
} catch {}
async function call(path = "", method = "GET", body, origin = base) {
  const res = await fetch(`${base}/api/cms/site${path ? `/${path}` : ""}`, {
    method,
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json() };
}
try {
  const loaded = await call();
  assert.equal(loaded.status, 200);
  assert.ok(loaded.data.schema.properties.work);
  assert.equal(
    (
      await call(
        "reset",
        "POST",
        { revision: loaded.data.revision },
        "https://example.invalid",
      )
    ).status,
    403,
  );
  const reset = await call("reset", "POST", { revision: loaded.data.revision });
  assert.equal(reset.status, 200);
  let entry = reset.data;
  const c = structuredClone(entry.draft.content);
  c.site.name = "CMS HTTP regression";
  const saved = await call("", "PUT", { content: c, revision: entry.revision });
  assert.equal(saved.status, 200);
  entry = saved.data;
  assert.ok(entry.changes.includes("site.name"));
  assert.deepEqual(await readFile(publicPath), before);
  assert.equal(
    (await call("", "PUT", { content: c, revision: reset.data.revision }))
      .status,
    409,
  );
  const invalid = structuredClone(c);
  invalid.site.github = "javascript:alert(1)";
  const refused = await call("", "PUT", {
    content: invalid,
    revision: entry.revision,
  });
  assert.equal(refused.status, 400);
  assert.ok(
    refused.data.issues.some((i) => i.path.join(".") === "site.github"),
  );
  assert.ok((await call("history")).data.length > 0);
  const published = await call("publish", "POST", { revision: entry.revision });
  assert.equal(published.status, 200, JSON.stringify(published.data));
  assert.equal(published.data.changes.length, 0);
  assert.equal(
    JSON.parse(await readFile(publicPath, "utf8")).site.name,
    "CMS HTTP regression",
  );
  const doc = JSON.parse(await readFile(publicPath, "utf8"));
  assert.ok(doc.site.title.includes("CMS HTTP regression"));
  assert.equal(
    doc.work.projects.length,
    JSON.parse(before).work.projects.length,
  );
  console.log(
    "PASS: real site API origin checks, schema-driven forms, private saves, stale-write rejection, field errors, history, explicit publication and metadata propagation.",
  );
} finally {
  await writeFile(publicPath, before);
  if (privateBefore) await writeFile(privatePath, privateBefore);
  else {
    try {
      await unlink(privatePath);
    } catch {}
  }
  await mkdir(".cms", { recursive: true });
}
