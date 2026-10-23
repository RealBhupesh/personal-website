export const cmsOwner = "RealBhupesh";
export const cmsOwnerId = "76155786";
export const websiteRepository = "RealBhupesh/personal-website";
export function cmsConfig() {
  const required = [
    "AUTH_SECRET",
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
    "CMS_GITHUB_APP_ID",
    "CMS_GITHUB_PRIVATE_KEY",
    "CMS_GITHUB_INSTALLATION_ID",
    "CMS_CONTENT_REPOSITORY",
  ];
  return {
    missing: required.filter((key) => !process.env[key]),
    privateRepository:
      process.env.CMS_CONTENT_REPOSITORY ?? "RealBhupesh/website-writing",
    privateBranch: process.env.CMS_CONTENT_BRANCH ?? "main",
    local:
      process.env.NODE_ENV !== "production" &&
      process.env.CMS_LOCAL_MODE === "true",
  };
}
export function isLoopbackHost(host: string | null) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host ?? "");
}
