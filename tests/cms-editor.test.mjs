import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
const dom = new JSDOM("<!DOCTYPE html><div id='editor'></div>");
for (const key of [
  "window",
  "document",
  "Node",
  "HTMLElement",
  "MutationObserver",
  "getComputedStyle",
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
test("visual editor preserves code, tables, emphasis, links and image paths when saving Markdown", () => {
  const source =
    "## A useful heading\n\nA **bold** thought with an [evidence link](https://example.com).\n\n```ts\nconst value = { count: 1 };\n```\n\n| One | Two |\n| --- | --- |\n| A | B |\n\n![A diagram](/uploads/cms/abc.png)";
  const editor = new Editor({
    element: document.getElementById("editor"),
    extensions: [StarterKit, Markdown, Image, TableKit],
    content: source,
    contentType: "markdown",
  });
  try {
    editor.commands.insertContentAt(
      editor.state.doc.content.size,
      "<p>An additional paragraph.</p>",
    );
    const result = editor.getMarkdown();
    assert.match(result, /## A useful heading/);
    assert.match(result, /\*\*bold\*\*/);
    assert.match(result, /https:\/\/example.com/);
    assert.match(result, /```ts\nconst value = \{ count: 1 \};/);
    assert.match(result, /\| One\s+\| Two/);
    assert.match(result, /!\[A diagram\]\(\/uploads\/cms\/abc.png\)/);
    assert.match(result, /An additional paragraph/);
  } finally {
    editor.destroy();
  }
});
