import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { cmsOwner, cmsOwnerId } from "@/lib/cms/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? "";
      return session;
    },
  },
});
