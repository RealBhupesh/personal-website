export type Role = {
  title: string;
  org: string;
  period?: string;
  summary: string;
  points: string[];
};

export type PullRequest = {
  number: number;
  url: string;
  title: string;
};

export type Contribution = {
  project: string;
  repo: string;
  about: string;
  summary: string;
  prs: PullRequest[];
  featured: boolean;
};

export const roles = [
  {
    title: "Founding Engineer (Internship)",
    org: "Physicore Engine Pvt Ltd",
    period: "June 2026 – August 2026",
    summary:
      "Built a mesh-based physics solver in Python and the browser interface that lets people work with it.",
    points: [
      "Translated mathematical models into browser-based simulation workflows.",
      "Built responsive interfaces with JavaScript, HTML, and Tailwind CSS, connecting formula controls to the solver.",
      "Owned development across solver logic, product UX, and rapid technical iteration.",
    ],
  },
  {
    title: "Freelance Software Developer",
    org: "Automotive detailing business, Canada",
    summary:
      "Launched a conversion-focused website and automated the business's order and email workflows.",
    points: [
      "Built the site and its SEO foundation, contributing to an estimated $2,000 in revenue within three weeks of launch.",
      "Automated order management and customer email workflows from the ground up, reducing manual coordination.",
    ],
  },
] as const satisfies readonly Role[];

export const openSourceIntro =
  "I learn a lot by working inside codebases I didn't write. These are merged changes to projects other people depend on.";

export const contributions = [
  {
    project: "Cloudflare Workers SDK",
    repo: "https://github.com/cloudflare/workers-sdk",
    about: "Cloudflare's toolchain for building and running Workers, including Wrangler and Miniflare.",
    summary:
      "Fixed Miniflare startup when a loopback port can't bind, handled dynamic retry delays in Wrangler workflows, and stopped the Vite plugin reloading on its own persistence writes.",
    prs: [
      {
        number: 15485,
        url: "https://github.com/cloudflare/workers-sdk/pull/15485",
        title: "fix(miniflare): reject loopback bind failures during startup",
      },
      {
        number: 15569,
        url: "https://github.com/cloudflare/workers-sdk/pull/15569",
        title: "[wrangler] Handle dynamic retry delays in workflows instances describe",
      },
      {
        number: 15574,
        url: "https://github.com/cloudflare/workers-sdk/pull/15574",
        title: "[vite-plugin] Ignore .wrangler persistence writes in Vite's file watcher",
      },
    ],
    featured: true,
  },
  {
    project: "Nanocoder",
    repo: "https://github.com/Nano-Collective/nanocoder",
    about: "An open-source, local-first AI coding agent for the terminal.",
    summary:
      "Kept the agent's context window under control by bounding oversized tool results, diffs, and file reads, and fixed provider discovery, model IDs, and terminal input handling.",
    prs: [
      { number: 741, url: "https://github.com/Nano-Collective/nanocoder/pull/741", title: "Fix update checks, cache presence, and network error classification" },
      { number: 742, url: "https://github.com/Nano-Collective/nanocoder/pull/742", title: "Fix wide terminal content width" },
      { number: 743, url: "https://github.com/Nano-Collective/nanocoder/pull/743", title: "docs: add local-first memory MCP recipe" },
      { number: 744, url: "https://github.com/Nano-Collective/nanocoder/pull/744", title: "fix: preserve multibyte input in alternate-screen TUI" },
      { number: 782, url: "https://github.com/Nano-Collective/nanocoder/pull/782", title: "fix: preview very large files before ranged reads" },
      { number: 784, url: "https://github.com/Nano-Collective/nanocoder/pull/784", title: "fix: bound string_replace result context" },
      { number: 785, url: "https://github.com/Nano-Collective/nanocoder/pull/785", title: "fix: summarize oversized git diffs" },
      { number: 786, url: "https://github.com/Nano-Collective/nanocoder/pull/786", title: "fix: cap oversized tool results" },
      { number: 798, url: "https://github.com/Nano-Collective/nanocoder/pull/798", title: "fix: bound diff_edit result context" },
      { number: 820, url: "https://github.com/Nano-Collective/nanocoder/pull/820", title: "fix: normalize Atlas Cloud GPT-5.6 model IDs" },
      { number: 830, url: "https://github.com/Nano-Collective/nanocoder/pull/830", title: "fix: restore ACP provider discovery" },
    ],
    featured: true,
  },
  {
    project: "Sentry JavaScript SDK",
    repo: "https://github.com/getsentry/sentry-javascript",
    about: "Sentry's official error and performance monitoring SDK for JavaScript.",
    summary: "Stopped the browser SDK tagging error events with DOMException.code, landed as a breaking change.",
    prs: [
      {
        number: 23992,
        url: "https://github.com/getsentry/sentry-javascript/pull/23992",
        title: "fix(browser)!: stop tagging DOMException.code on events",
      },
    ],
    featured: true,
  },
  {
    project: "Grafana Faro Web SDK",
    repo: "https://github.com/grafana/faro-web-sdk",
    about: "Grafana's frontend observability SDK.",
    summary: "Fixed a race where telemetry signals added during a batch flush were silently dropped.",
    prs: [
      {
        number: 2257,
        url: "https://github.com/grafana/faro-web-sdk/pull/2257",
        title: "fix(core): do not drop signals added during BatchExecutor flush",
      },
    ],
    featured: true,
  },
  {
    project: "Gumroad",
    repo: "https://github.com/antiwork/gumroad",
    about: "The open-source codebase behind Gumroad.",
    summary:
      "Ported the price checker service's RSpec suite to fixture-backed Minitest with Elasticsearch isolation. The merged version ran in 17.0s versus 137.1s on the same host. Co-authored.",
    prs: [
      {
        number: 6609,
        url: "https://github.com/antiwork/gumroad/pull/6609",
        title: "Port the price checker service spec to Minitest and fixtures",
      },
    ],
    featured: true,
  },
  {
    project: "Plane",
    repo: "https://github.com/makeplane/plane",
    about: "An open-source project management tool.",
    summary: "Fixed sub-work items not showing on their parent in local mode.",
    prs: [
      {
        number: 9804,
        url: "https://github.com/makeplane/plane/pull/9804",
        title: "fix(web): show sub-work items on the parent in local",
      },
    ],
    featured: false,
  },
  {
    project: "NestJS Schematics",
    repo: "https://github.com/nestjs/schematics",
    about: "The code generators behind the NestJS CLI.",
    summary: "Set an explicit rootDir in the tsconfig generated for new applications.",
    prs: [
      {
        number: 2435,
        url: "https://github.com/nestjs/schematics/pull/2435",
        title: "fix(application): set explicit rootDir in generated tsconfig",
      },
    ],
    featured: false,
  },
  {
    project: "Lokus",
    repo: "https://github.com/lokus-ai/lokus",
    about: "A local-first notes and knowledge app.",
    summary:
      "Added plain-text note support and agenda and task improvements across the parser, editor, and calendar, with tests.",
    prs: [
      {
        number: 439,
        url: "https://github.com/lokus-ai/lokus/pull/439",
        title: "Feature/txt support",
      },
    ],
    featured: false,
  },
] as const satisfies readonly Contribution[];

export const mergedPrCount = contributions.reduce((total, item) => total + item.prs.length, 0);

export const skills = [
  { label: "Languages", items: ["Python", "TypeScript", "JavaScript", "SQL", "Ruby"] },
  { label: "AI", items: ["OpenAI API", "Groq", "Gemini", "OpenRouter", "Vercel AI SDK", "MediaPipe"] },
  { label: "Applications", items: ["React", "Next.js", "Node.js", "FastAPI", "REST APIs", "PostgreSQL", "Supabase", "Drizzle ORM"] },
  { label: "Testing and CI", items: ["Pytest", "Minitest", "Vitest", "Playwright", "Ruff", "GitHub Actions"] },
] as const;

export const training = [
  "Ethnus S.Dot, an advanced training cohort for high-performing students.",
  "Talent Battle, aptitude, logical reasoning, and data structures and algorithms training.",
] as const;
