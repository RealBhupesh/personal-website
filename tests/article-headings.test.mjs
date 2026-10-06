import assert from "node:assert/strict";
import { test } from "node:test";
import { getArticleHeadings } from "../lib/article-headings.ts";

test("the section rail excludes code examples and uses readable inline heading text", () => {
  const headings = getArticleHeadings('# Title\n\n## What it gets **right**\n\n```md\n## This is code\n```\n\n### The `write` default\n\n<Figure src="/diagram.svg" />');
  assert.deepEqual(headings, [
    {id: 'what-it-gets-right', label: 'What it gets right', depth: 0},
    {id: 'the-write-default', label: 'The write default', depth: 1},
  ]);
});

test("duplicate sections get distinct fragment IDs and Unicode headings remain usable", () => {
  assert.deepEqual(getArticleHeadings('## Déjà vu?\n\n## Déjà vu?\n\n## Would I use it?'), [
    {id: 'déjà-vu', label: 'Déjà vu?', depth: 0},
    {id: 'déjà-vu-1', label: 'Déjà vu?', depth: 0},
    {id: 'would-i-use-it', label: 'Would I use it?', depth: 0},
  ]);
});
