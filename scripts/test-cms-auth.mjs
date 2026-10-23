import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const base = new URL(process.env.CMS_TEST_URL ?? "http://127.0.0.1:3101");
assert.ok(
  ["127.0.0.1", "localhost", "www.bhupeshcholake.in"].includes(base.hostname),
  "Only test the local or production writing studio",
);
const response = await fetch(new URL("/admin", base));
assert.equal(response.status, 200);
const document = new JSDOM(await response.text()).window.document;
const button = [...document.querySelectorAll("button")].find((button) =>
  button.textContent.includes("Continue with GitHub"),
);
assert.ok(button, "Configured studio must offer GitHub sign-in");
const form = button.closest("form");
assert.equal(form?.getAttribute("method")?.toLowerCase(), "post");
assert.equal(
  form?.getAttribute("action"),
  "/admin/sign-in",
  "Sign-in must use a native form redirect, independent of React action navigation",
);
const target = new URL(form.getAttribute("action"), base);
for (const origin of [undefined, "https://example.invalid"]) {
  const rejected = await fetch(target, {
    method: "POST",
    headers: origin ? { Origin: origin } : {},
    redirect: "manual",
  });
  assert.equal(rejected.status, 403, "Sign-in requires a same-origin POST");
}
assert.equal((await fetch(target, { redirect: "manual" })).status, 405);
const signIn = await fetch(target, {
  method: "POST",
  headers: { Origin: base.origin },
  redirect: "manual",
});
assert.equal(signIn.status, 303, "Use a real HTTP redirect after the POST");
const github = new URL(signIn.headers.get("location"));
assert.equal(github.origin, "https://github.com");
assert.equal(github.pathname, "/login/oauth/authorize");
assert.equal(
  github.searchParams.get("redirect_uri"),
  new URL("/api/auth/callback/github", base).href,
);
assert.ok(github.searchParams.get("client_id"));
assert.ok(github.searchParams.get("code_challenge"));
assert.equal(github.searchParams.get("code_challenge_method"), "S256");
assert.match(
  signIn.headers.get("set-cookie") ?? "",
  /authjs\.pkce\.code_verifier=/,
);
assert.equal((await fetch(new URL("/api/cms/posts", base))).status, 401);
console.log(
  "PASS: native sign-in form, origin protection, GitHub redirect, PKCE cookies, and private dashboard authorization.",
);
