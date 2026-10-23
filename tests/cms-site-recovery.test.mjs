import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { siteContentSchema } from "../lib/cms/site-model.ts";
import { siteEditorSchema } from "../lib/cms/site-service.ts";
import { recoverableSiteContent } from "../components/cms/site-recovery.ts";
test("incomplete edits recover after reload without relaxing server save validation", () => {
  const c = JSON.parse(
    readFileSync(new URL("../data/site-content.json", import.meta.url)),
  );
  c.site.name = "";
  c.work.projects.push({
    ...c.work.projects[0],
    title: "",
    slug: "",
    href: "",
  });
  assert.throws(() => siteContentSchema.parse(c));
  assert.equal(recoverableSiteContent(c, siteEditorSchema()), true);
  c.work.projects = { broken: true };
  assert.equal(recoverableSiteContent(c, siteEditorSchema()), false);
});
test("the standalone GitHub refresh command resolves its configuration without Next.js", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const result = await promisify(execFile)(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "scripts/refresh-contributions.mjs",
      "--check",
    ],
    { cwd: new URL("..", import.meta.url) },
  );
  assert.match(result.stdout, /configuration valid/);
});
