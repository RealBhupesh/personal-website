import Link from "next/link";
import { headers } from "next/headers";
import { signOut } from "@/auth";
import { cmsConfig, cmsOwner, isLoopbackHost } from "@/lib/cms/config";
import { requireOwner } from "@/lib/cms/server";
import { Studio } from "@/components/cms/studio";
import { SetupGuide } from "@/components/cms/setup-guide";
export const dynamic = "force-dynamic";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const config = cmsConfig();
  const local = config.local && isLoopbackHost((await headers()).get("host"));
  if (config.missing.length && !local)
    return <SetupGuide missing={config.missing} />;
  let allowed = false;
  try {
    await requireOwner();
    allowed = true;
  } catch {}
  if (!allowed)
    return (
      <div className="studio-login">
        <Link href="/">Bhupesh Cholake</Link>
        <div>
          <p className="studio-muted">Your private writing workspace</p>
          <h1>A place for the next idea.</h1>
          <p>
            Write, revise, and publish to your website. Only {cmsOwner}&apos;s
            GitHub account can enter.
          </p>
          {error && (
            <p role="alert" className="studio-error">
              {error === "Configuration"
                ? "GitHub sign-in is not configured correctly. Check the app's Client ID, client secret, and callback URL in Vercel and GitHub, then redeploy."
                : error === "AccessDenied"
                  ? "This workspace is private. Sign in with RealBhupesh’s GitHub account."
                  : "GitHub sign-in could not be completed. Try again. If this continues, check the app's callback URL and client secret."}
            </p>
          )}
          <form action="/admin/sign-in" method="post">
            <button type="submit" className="studio-primary">
              Continue with GitHub
            </button>
          </form>
        </div>
      </div>
    );
  return (
    <Studio
      local={local}
      logout={async () => {
        "use server";
        await signOut({ redirectTo: "/admin" });
      }}
    />
  );
}
