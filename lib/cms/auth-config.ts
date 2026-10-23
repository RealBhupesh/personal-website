import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { cmsOwner, cmsOwnerId } from "./config.ts";

export const cmsAuthConfig = {
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/admin", error: "/admin" },
  callbacks: {
    async signIn({ account, profile }) {
      return (
        account?.provider === "github" &&
        String(profile?.id) === cmsOwnerId &&
        String(profile?.login).toLowerCase() === cmsOwner.toLowerCase()
      );
    },
    async jwt({ token, account, profile }) {
      // Auth.js uses an internal UUID for token.sub. Keep the verified GitHub
      // identity separately; session updates must never supply this claim.
      if (account) {
        token.githubAccountId =
          account.provider === "github" &&
          account.providerAccountId === cmsOwnerId &&
          String(profile?.id) === cmsOwnerId &&
          String(profile?.login).toLowerCase() === cmsOwner.toLowerCase()
            ? cmsOwnerId
            : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user)
        session.user.id =
          typeof token.githubAccountId === "string"
            ? token.githubAccountId
            : "";
      return session;
    },
  },
} satisfies NextAuthConfig;
