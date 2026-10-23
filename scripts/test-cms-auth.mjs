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
assert.equal(
  (
    await fetch(new URL("/api/cms/posts", base), {
      headers: { "Accept-Encoding": "identity" },
    })
  ).status,
  401,
);
console.log(
  "PASS: native sign-in form, origin protection, GitHub redirect, PKCE cookies, and private dashboard authorization.",
);
