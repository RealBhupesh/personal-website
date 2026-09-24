import { contributions, mergedPrCount, roles } from "@/config/experience";
import { site } from "@/config/site";

/** Facts used by the About page, schema, and llms.txt. Keep these identical. */
export const profile = {
  updated: "2026-09-24",
  location: "Nashik, Maharashtra, India",
  education:
    "Bachelor of Engineering in Artificial Intelligence and Data Science, CGPA 8.6/10",
  seeking:
    "an AI engineer role, or software work that asks him to think deeply, learn quickly, and take responsibility for shipping something",
  headline: "Software engineer building AI applications",
} as const;

const [recentRole] = roles;
const projectNames = contributions.map((item) => item.project);

export const faqs = [
  {
    question: "Who is Bhupesh Cholake?",
    answer: `Bhupesh Cholake is a software engineer from Nashik, India, who builds AI applications. He studied Artificial Intelligence and Data Science, was a founding engineer intern at ${recentRole.org} (${recentRole.period}), and has merged open-source contributions in projects including Cloudflare's Workers SDK, Sentry, and Grafana Faro. This website is his own account of that work.`,
  },
  {
    question: "Is Bhupesh Cholake an AI engineer?",
    answer:
      "Bhupesh Cholake builds AI applications, including a hotel guest assistant that keeps an LLM inside the hotel's own facts, a real-time pose-feedback fitness coach, and an agentic Discord bot. He has also fixed context-management issues in Nanocoder, an open-source AI coding agent. He is looking for an AI engineer role.",
  },
  {
    question: "What has Bhupesh Cholake contributed to open source?",
    answer: `Bhupesh Cholake has ${mergedPrCount} merged pull requests across ${projectNames.join(", ")}. The full list, with links to each pull request, is at ${site.url}/about#open-source.`,
  },
  {
    question: "Where has Bhupesh Cholake worked?",
    answer: `Bhupesh Cholake was a founding engineer intern at ${recentRole.org} from ${recentRole.period}, where he built a mesh-based physics solver in Python and its browser interface. He has also worked as a freelance software developer for a business in Canada.`,
  },
  {
    question: "Is Bhupesh Cholake looking for work?",
    answer: `Yes. Bhupesh Cholake is looking for ${profile.seeking}. The best way to reach him is ${site.email}.`,
  },
  {
    question: "Where is Bhupesh Cholake based?",
    answer: `Bhupesh Cholake is based in ${profile.location}.`,
  },
  {
    question: "What did Bhupesh Cholake study?",
    answer: `Bhupesh Cholake completed a ${profile.education}.`,
  },
  {
    question: "How can someone contact Bhupesh Cholake?",
    answer: `Email ${site.email}. His GitHub is ${site.github}, and his LinkedIn is ${site.linkedin}.`,
  },
] as const;
