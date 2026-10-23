import "server-only";
import { createAppAuth } from "@octokit/auth-app";
import { headers } from "next/headers";
import { auth } from "@/auth";
import {
  cmsConfig,
  cmsOwnerId,
  isLoopbackHost,
  websiteRepository,
} from "./config";
import { CmsError } from "./model";
import { GitHubRepository, type GitRequest } from "./repository";
import { LocalRepository } from "./local-repository";
import { join } from "node:path";
import { CmsService } from "./service";

export async function requireOwner() {
  const config = cmsConfig();
  const host = (await headers()).get("host");
  if (config.local && isLoopbackHost(host)) return { local: true };
  if (config.missing.length)
    throw new CmsError(
      "The writing workspace needs its GitHub App setup before sign-in.",
      503,
    );
  const session = await auth();
  if (session?.user?.id !== cmsOwnerId)
    throw new CmsError("Sign in with the website owner's GitHub account.", 401);
  return { local: false };
}
export function requireMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Browser mutations must carry the same origin, including local development.
  let sameOrigin = false;
  try {
    const parsed = new URL(origin ?? "");
    sameOrigin =
      parsed.origin === origin &&
      parsed.host === request.headers.get("host") &&
      (parsed.protocol === "https:" ||
        (process.env.NODE_ENV !== "production" &&
          parsed.protocol === "http:" &&
          isLoopbackHost(parsed.host)));
  } catch {}
  if (!sameOrigin)
    throw new CmsError(
      "This request did not come from the writing dashboard.",
      403,
    );
}
async function gitRequest(): Promise<GitRequest> {
  const app = createAppAuth({
    appId: process.env.CMS_GITHUB_APP_ID!,
    privateKey: process.env.CMS_GITHUB_PRIVATE_KEY!.replaceAll("\\n", "\n"),
    installationId: Number(process.env.CMS_GITHUB_INSTALLATION_ID),
  });
  const { token } = await app({ type: "installation" });
  return async <T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> => {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:
          method === "GET" && path.includes("/contents/")
            ? "application/vnd.github.object+json"
            : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "bhupesh-writing-studio",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      if (response.status === 404)
        throw new CmsError(
          "GitHub file or repository not found. Check the app installation.",
          404,
        );
      if ([409, 422].includes(response.status))
        throw new CmsError(
          "GitHub has a newer revision. Reload the saved version before retrying.",
          409,
        );
      if (response.status === 403)
        throw new CmsError(
          "GitHub rejected the request. Check app permissions or try again after the rate limit resets.",
          502,
        );
      throw new CmsError(
        `GitHub could not complete this operation (${response.status}). Your local recovery copy is unchanged.`,
        502,
      );
    }
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  };
}
export async function getCmsService() {
  const { local } = await requireOwner();
  const config = cmsConfig();
  if (local)
    return new CmsService(
      new LocalRepository(join(process.cwd(), ".cms")),
      new LocalRepository(process.cwd()),
    );
  const request = await gitRequest();
  const repo = await request<{ private: boolean }>(
    `/repos/${config.privateRepository}`,
  );
  if (!repo.private)
    throw new CmsError(
      "Draft storage must be a private repository. No draft has been saved.",
      503,
    );
  if (
    config.privateRepository.toLowerCase() === websiteRepository.toLowerCase()
  )
    throw new CmsError(
      "Drafts cannot be stored in the public website repository.",
      503,
    );
  return new CmsService(
    new GitHubRepository(
      config.privateRepository,
      config.privateBranch,
      request,
    ),
    new GitHubRepository(websiteRepository, "main", request),
  );
}
