import assert from "node:assert/strict";

const base = new URL(process.env.CMS_TEST_URL ?? "http://127.0.0.1:3101");
assert.ok(
  ["127.0.0.1", "localhost", "www.bhupeshcholake.in"].includes(base.hostname),
  "Only test the local or production writing studio",
);
const response = await fetch(new URL("/admin", base), {
  headers: { "Accept-Encoding": "identity" },
});
assert.equal(response.status, 200);
const html = await response.text();
const form = html.match(
  /<form\b[^>]*>[\s\S]*?Continue with GitHub[\s\S]*?<\/form>/,
)?.[0];
assert.ok(form, "Configured studio must offer GitHub sign-in");
assert.match(form, /method="post"/i);
const action = form.match(/action="([^"]+)"/)?.[1];
assert.equal(
  action,
  "/admin/sign-in",
  "Sign-in must use a native form redirect, independent of React action navigation",
);
const target = new URL(action, base);
for (const origin of [undefined, "https://example.invalid"]) {
  const rejected = await fetch(target, {
    method: "POST",
    headers: {
      "Accept-Encoding": "identity",
      ...(origin ? { Origin: origin } : {}),
    },
    redirect: "manual",
  });
  assert.equal(rejected.status, 403, "Sign-in requires a same-origin POST");
}
assert.equal(
  (
    await fetch(target, {
      headers: { "Accept-Encoding": "identity" },
      redirect: "manual",
    })
  ).status,
  405,
);
const signIn = await fetch(target, {
  method: "POST",
  headers: { Origin: base.origin, "Accept-Encoding": "identity" },
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
// Exercise the supported browser flow: CSRF fetch, same-origin sign-in fetch,
// then navigation only after the verification cookie has been returned.
const csrf = await fetch(new URL("/api/auth/csrf", base), {
  headers: { "Accept-Encoding": "identity" },
});
const { csrfToken } = await csrf.json();
const cookie = csrf.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
const browserSignIn = await fetch(new URL("/api/auth/signin/github", base), {
  method: "POST",
  headers: {
    Origin: base.origin,
    Cookie: cookie,
    "Accept-Encoding": "identity",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Auth-Return-Redirect": "1",
  },
  body: new URLSearchParams({ csrfToken, callbackUrl: "/admin" }),
});
assert.equal(browserSignIn.status, 200);
const authorization = new URL((await browserSignIn.json()).url);
assert.equal(authorization.origin, "https://github.com");
assert.equal(authorization.pathname, "/login/oauth/authorize");
assert.ok(authorization.searchParams.get("code_challenge"));
assert.match(
  browserSignIn.headers.get("set-cookie") ?? "",
  /authjs\.pkce\.code_verifier=/,
);
const missingCookie = await fetch(
  new URL("/api/auth/callback/github?code=cms-test-missing-cookie", base),
  {
    headers: { "Accept-Encoding": "identity" },
    redirect: "manual",
  },
);
assert.equal(
  new URL(missingCookie.headers.get("location")).searchParams.get("error"),
  "VerificationExpired",
);
assert.equal(
  (
    await fetch(new URL("/api/cms/posts", base), {
      headers: { "Accept-Encoding": "identity" },
    })
  ).status,
  401,
);
console.log(
  "PASS: native fallback, browser CSRF/sign-in flow, verification cookies, missing-cookie recovery, and private dashboard authorization.",
);
