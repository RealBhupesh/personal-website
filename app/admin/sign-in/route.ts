import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { requireMutationOrigin } from "@/lib/cms/server";
import { CmsError } from "@/lib/cms/model";

async function githubDestination() {
  const destination = new URL(
    await signIn("github", {
      redirect: false,
      redirectTo: "/admin",
    }),
  );
  if (
    destination.origin !== "https://github.com" ||
    destination.pathname !== "/login/oauth/authorize"
  )
    throw new CmsError(
      "GitHub sign-in is not configured correctly. Return to /admin to check setup.",
      503,
    );
  return destination;
}

export async function GET(request: Request) {
  // Starting authorization doesn't grant access. Still reject cross-site
  // initiation so another site can't replace an in-progress verifier cookie.
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Start sign-in from the writing dashboard.", {
      status: 403,
    });
  if (request.headers.has("origin")) {
    try {
      requireMutationOrigin(request);
    } catch {
      return new Response("Start sign-in from the writing dashboard.", {
        status: 403,
      });
    }
  }
  try {
    const destination = await githubDestination();
    const href = destination.href
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
    // This deliberately uses a complete HTML document with native links. The
    // browser stores cookies on this 200 response before the user leaves the
    // site. No React hydration, form submission, or JS navigation is required.
    return new Response(
      `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Continue to GitHub · Writing studio</title>
<style>
:root{color-scheme:light dark;--bg:#f6f4ef;--ink:#1c1b19;--muted:#5c574f}
@media(prefers-color-scheme:dark){:root{--bg:#121110;--ink:#eceae4;--muted:#a8a299}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:clamp(32px,8vw,80px) 28px}a{color:inherit}header a{text-decoration:none;font-weight:600}section{margin:clamp(64px,12vh,120px) 0}h1{font-size:clamp(28px,5vw,38px);line-height:1.2;font-weight:500;letter-spacing:-.025em;margin:0 0 24px}p{margin:0 0 28px;max-width:540px}.continue{display:inline-flex;align-items:center;justify-content:center;background:var(--ink);color:var(--bg);padding:12px 20px;border-radius:7px;font-weight:500;text-decoration:none}.continue:hover{opacity:.85}a:focus-visible{outline:2px solid var(--ink);outline-offset:5px}.back{display:block;width:fit-content;color:var(--muted);margin-top:28px}
</style></head><body><main><header><a href="/">Bhupesh Cholake</a></header><section><h1>Continue to your writing studio.</h1><p>Sign in with RealBhupesh on GitHub. You'll return here to write and publish. Continue in this same tab.</p><a class="continue" id="github-authorize" href="${href}">Continue to GitHub</a><a class="back" href="/admin">Back to the dashboard</a></section></main></body></html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store, max-age=0",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    if (error instanceof CmsError)
      return new Response(error.message, { status: error.status });
    if (error instanceof AuthError)
      return NextResponse.redirect(
        new URL("/admin?error=Configuration", request.url),
        303,
      );
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Auth.js's server helper skips its form CSRF check, so enforce our
    // same-origin check before starting authorization or writing cookies.
    requireMutationOrigin(request);
    const destination = await githubDestination();
    // A native form and HTTP redirect also work without hydration and avoid
    // relying on React's external server-action redirect handling.
    return NextResponse.redirect(destination, 303);
  } catch (error) {
    if (error instanceof CmsError)
      return new Response(error.message, { status: error.status });
    if (error instanceof AuthError)
      return NextResponse.redirect(
        new URL("/admin?error=Configuration", request.url),
        303,
      );
    throw error;
  }
}
