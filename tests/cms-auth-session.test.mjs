import assert from "node:assert/strict";
import { test } from "node:test";
import { Auth, customFetch } from "@auth/core";
import GitHub from "@auth/core/providers/github";
import { cmsAuthConfig } from "../lib/cms/auth-config.ts";
import { cmsOwner, cmsOwnerId } from "../lib/cms/config.ts";

const base = process.env.CMS_AUTH_HTTP_URL ?? "https://studio.example.test";
async function authorize(profile) {
  // Exercise the installed Auth.js OAuth/PKCE/JWT/session pipeline. Only the
  // external GitHub token and profile responses are replaced with fixtures.
  const config = {
    ...cmsAuthConfig,
    secret: "cms-session-regression-only-secret",
    trustHost: true,
    basePath: "/api/auth",
    logger: { error() {} },
    providers: [
      GitHub({
        clientId: "cms-test-client",
        clientSecret: "cms-test-secret",
        userinfo: {
          url: "https://api.github.com/user",
          request: async () => profile,
        },
        [customFetch]: async (input) => {
          assert.equal(new URL(input).pathname, "/login/oauth/access_token");
          return Response.json({
            access_token: "fixture-only-token",
            token_type: "bearer",
            scope: "read:user user:email",
          });
        },
      }),
    ],
  };
  const jar = new Map();
  async function call(path, init = {}) {
    const response = await Auth(
      new Request(`${base}/api/auth/${path}`, {
        ...init,
        headers: {
          Cookie: [...jar]
            .map(([name, value]) => `${name}=${value}`)
            .join("; "),
          ...init.headers,
        },
      }),
      config,
    );
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const separator = pair.indexOf("=");
      jar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return response;
  }
  const { csrfToken } = await (await call("csrf")).json();
  const start = await call("signin/github", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, callbackUrl: `${base}/admin` }),
  });
  assert.equal(start.status, 302);
  const location = new URL(start.headers.get("location"));
  assert.equal(location.origin, "https://github.com");
  assert.ok(location.searchParams.get("code_challenge"));
  const callback = await call(
    "callback/github?code=fixture-only-authorization-code",
  );
  const session = await (await call("session")).json();
  return {
    callback,
    session,
    cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

test("a GitHub owner authorization creates a session accepted by the dashboard owner check", async () => {
  const { callback, session } = await authorize({
    id: Number(cmsOwnerId),
    login: cmsOwner,
    name: "Bhupesh",
    email: "fixture@example.test",
    avatar_url: "",
  });
  assert.equal(callback.headers.get("location"), `${base}/admin`);
  assert.ok(
    session?.user,
    "The successful GitHub callback must create a session",
  );
  assert.equal(
    session.user.id,
    cmsOwnerId,
    "The dashboard checks the GitHub account ID, not Auth.js's generated internal UUID",
  );
});

test("a different GitHub account cannot create an owner session", async () => {
  const { callback, session } = await authorize({
    id: 123,
    login: cmsOwner,
    name: "Other account",
    email: "other@example.test",
    avatar_url: "",
  });
  assert.equal(
    new URL(callback.headers.get("location")).searchParams.get("error"),
    "AccessDenied",
  );
  assert.equal(session, null);
});

test("session updates cannot turn an unverified UUID session into the GitHub owner", async () => {
  const token = { sub: "internal-user-uuid" };
  const result = await cmsAuthConfig.callbacks.jwt({
    token,
    trigger: "update",
    session: { githubAccountId: cmsOwnerId, user: { id: cmsOwnerId } },
  });
  const session = await cmsAuthConfig.callbacks.session({
    session: { user: {} },
    token: result,
  });
  assert.equal(session.user.id, "");
});

test(
  "a completed GitHub session opens the actual dashboard route",
  {
    skip: !process.env.CMS_AUTH_HTTP_URL,
  },
  async () => {
    assert.match(
      base,
      /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
      "Fixture sessions must only be sent to the local regression server",
    );
    const { cookie } = await authorize({
      id: Number(cmsOwnerId),
      login: cmsOwner,
      name: "Bhupesh",
      email: "fixture@example.test",
      avatar_url: "",
    });
    const response = await fetch(`${base}/admin`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Studio navigation/);
    assert.doesNotMatch(html, /Continue with GitHub/);
    const signInPage = await fetch(`${base}/admin/sign-in`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert.equal(
      signInPage.status,
      303,
      "A signed-in owner must return to the dashboard",
    );
    assert.equal(
      new URL(signInPage.headers.get("location")).pathname,
      "/admin",
    );
  },
);
