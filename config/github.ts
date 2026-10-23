import { content } from "./content";
export const githubUsername = content.github.username;
export const githubCreditEmails = content.github.creditEmails;
export const coauthoredPullRequests = content.github.creditedPullRequests.map(
  (p) => p.url,
);
