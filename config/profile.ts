import { site } from "@/config/site";

/** Facts used by the About page, schema, and llms.txt. Keep these identical. */
export const profile = {
  updated: "2026-09-23",
  location: "Nashik, Maharashtra, India",
  education:
    "Bachelor of Engineering in Artificial Intelligence and Data Science, CGPA 8.6/10",
  seeking:
    "an AI engineer role, or software work that asks him to think deeply, learn quickly, and take responsibility for shipping something",
} as const;

export const faqs = [
  {
    question: "Who is Bhupesh Cholake?",
    answer:
      "Bhupesh Cholake is a software engineer from Nashik, India. He studied Artificial Intelligence and Data Science and builds applied AI products, including community tools, a hotel guest assistant, and research software. This website is his own account of that work.",
  },
  {
    question: "Is Bhupesh Cholake an AI engineer?",
    answer:
      "Bhupesh Cholake builds applied AI software and studied Artificial Intelligence and Data Science. He is looking for an AI engineer role. He is not describing a current full-time job title on this site.",
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
