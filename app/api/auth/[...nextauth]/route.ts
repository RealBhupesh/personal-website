import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (
    request.nextUrl.pathname.endsWith("/callback/github") &&
    request.nextUrl.searchParams.has("code") &&
    !request.cookies
      .getAll()
      .some(
        (cookie) =>
          cookie.name.endsWith("authjs.pkce.code_verifier") && cookie.value,
      )
  ) {
    // Fail closed with an actionable explanation instead of a generic loop.
    return NextResponse.redirect(
      new URL("/admin?error=VerificationExpired", request.url),
    );
  }
  return handlers.GET(request);
}
export const POST = handlers.POST;
