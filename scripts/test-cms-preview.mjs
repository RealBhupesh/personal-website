import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.CMS_TEST_URL ?? "http://127.0.0.1:3102";
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
assert.equal((await fetch(`${base}/admin`)).status, 200);
const manifest = JSON.parse(
  await readFile(".next/dev/server/server-reference-manifest.json", "utf8"),
);
const action = Object.entries(manifest.node).find(
  ([, entry]) => entry.exportedName === "previewArticle",
);
assert.ok(
  action,
  "Preview action must be registered in the running dev server",
);
const now = new Date().toISOString();
const article = {
  id: "preview-regression",
  title: "Preview check",
  description: "Private test, never saved.",
  slug: "preview-regression",
  date: now.slice(0, 10),
  tags: [],
  createdAt: now,
  updatedAt: now,
  body: '## Readable preview\n\n```ts\nconst previewRegression = true;\n```\n\n<JostracaDiagram kind="two-phases" />\n\n![Private image](/uploads/cms/preview-test.png)',
};
async function preview(candidate) {
  const response = await fetch(`${base}/admin`, {
    method: "POST",
    headers: {
      Origin: base,
      "Next-Action": action[0],
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify([candidate]),
  });
  assert.equal(response.status, 200);
  return response.text();
}
const rendered = await preview(article);
assert.doesNotMatch(
  rendered,
  /:E\{|Could not find the module|could not be previewed/,
);
assert.match(rendered, /Readable preview/);
assert.match(rendered, /previewRegression/);
assert.match(rendered, /article-code-toolbar/);
assert.match(rendered, /jostraca-diagram/);
assert.match(rendered, /\/api\/cms\/media\/preview-test/);
const unsafe = await preview({ ...article, body: "<script>alert(1)</script>" });
assert.match(unsafe, /Unsupported HTML or MDX component/);
assert.doesNotMatch(unsafe, /alert\(1\)/);
console.log(
  "PASS: preview renders code and diagrams through the real Server Action, keeps media private, and rejects unsafe MDX.",
);
