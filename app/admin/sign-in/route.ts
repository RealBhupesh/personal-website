import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { requireMutationOrigin } from "@/lib/cms/server";
import { CmsError } from "@/lib/cms/model";

export async function POST(request: Request) {
  try {
    // Auth.js's server helper skips its form CSRF check, so enforce our
    // same-origin check before starting authorization or writing cookies.
    requireMutationOrigin(request);
    const destination = await signIn("github", {
      redirect: false,
      redirectTo: "/admin",
    });
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
