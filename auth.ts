import NextAuth from "next-auth";
import { cmsAuthConfig } from "@/lib/cms/auth-config";

export const { handlers, auth, signIn, signOut } = NextAuth(cmsAuthConfig);
