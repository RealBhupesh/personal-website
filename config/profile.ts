import { site } from "@/config/site";

/** Facts used by the About page, schema, and llms.txt. Keep these identical. */
export const profile = {
  updated: "2026-10-04",
  location: "Nashik, Maharashtra, India",
  education:
    "Bachelor of Engineering in Artificial Intelligence and Data Science, CGPA 8.6/10",
  seeking:
    "an AI engineer role where he can build the model workflow, the application around it, and the experience of using it",
  headline: "Software engineer building AI applications",
} as const;

export const getFaqs = (mergedPrCount: number, mergedProjectCount: number) => [
  {
    question: "What kind of role are you looking for?",
    answer:
      "I'm looking for an AI engineer role where I can work across model behaviour, application code, and the experience of using the product. I enjoy taking a problem far enough to understand it, then building something people can use.",
  },
  {
    question: "Can I try your projects?",
    answer:
      "Asteria and Focus Timer have live demos linked from Work. The other projects include self-hosted tools, prototypes, and research code. Each project page explains its current state and links to the source and setup instructions.",
  },
  {
    question: "What have you contributed to open source?",
    answer: `I have ${mergedPrCount} merged pull requests across ${mergedProjectCount} projects, including Cloudflare's Workers SDK, Nanocoder, Sentry, and Grafana Faro. The list above also includes open and closed PRs, with links to the changes and their current status.`,
  },
  {
    question: "Where are you based?",
    answer: `I'm based in ${profile.location}.`,
  },
  {
    question: "How can I reach you?",
    answer: `Email ${site.email}. Tell me a little about the role, project, or problem you have in mind. My GitHub and LinkedIn are linked on this page, too.`,
  },
] as const;
