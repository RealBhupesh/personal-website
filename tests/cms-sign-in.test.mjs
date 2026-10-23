import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import ts from "typescript";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM("<!DOCTYPE html><div id='root'></div>", {
  url: "https://www.bhupeshcholake.in/admin",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Load the real TSX component while replacing only the external auth boundary.
// This tests the actual form's click, pending state, error, and retry behavior.
const authMock = `data:text/javascript,${encodeURIComponent("export const signIn = (...args) => globalThis.cmsSignInTest(...args)")}`;
const source = await readFile(
  new URL("../components/cms/github-sign-in.tsx", import.meta.url),
  "utf8",
);
const compiled = ts
  .transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
  })
  .outputText.replaceAll(
    '"react"',
    JSON.stringify(import.meta.resolve("react")),
  )
  .replaceAll(
    '"react/jsx-runtime"',
    JSON.stringify(import.meta.resolve("react/jsx-runtime")),
  )
  .replaceAll('"next-auth/react"', JSON.stringify(authMock));
const { GitHubSignIn } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("GitHub sign-in click shows progress, reports failure, and allows retry", async () => {
  let rejectSignIn;
  const calls = [];
  globalThis.cmsSignInTest = (...args) => {
    calls.push(args);
    return new Promise((_, reject) => {
      rejectSignIn = reject;
    });
  };
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(createElement(GitHubSignIn)));
    const button = document.querySelector("button");
    assert.equal(button.textContent, "Continue with GitHub");
    await act(async () => button.click());
    assert.equal(button.disabled, true);
    assert.equal(button.textContent, "Opening GitHub…");
    assert.match(
      document.querySelector('[role="status"]').textContent,
      /Connecting securely/,
    );
    assert.deepEqual(calls, [
      ["github", { redirect: false, redirectTo: "/admin" }],
    ]);
    await act(async () => rejectSignIn(new Error("network unavailable")));
    assert.equal(button.disabled, false);
    assert.match(
      document.querySelector('[role="alert"]').textContent,
      /GitHub could not be opened/,
    );
    globalThis.cmsSignInTest = async () => ({
      ok: false,
      error: "Configuration",
      url: null,
    });
    await act(async () => button.click());
    assert.equal(button.disabled, false);
    assert.match(
      document.querySelector('[role="alert"]').textContent,
      /try again/,
    );
    globalThis.cmsSignInTest = async () => ({
      ok: true,
      url: "https://example.invalid/login",
    });
    await act(async () => button.click());
    assert.equal(button.disabled, false);
    assert.ok(
      document.querySelector('[role="alert"]'),
      "Unexpected destinations must not be followed",
    );
  } finally {
    await act(async () => root.unmount());
    delete globalThis.cmsSignInTest;
  }
});
