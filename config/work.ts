export type WorkImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  title: string;
  displayTitle?: string;
  summary: string;
  lede: string;
  paragraphs: string[];
  audience?: string;
  available?: string;
  signal?: string;
  image?: WorkImage;
  stack: string[];
  demo?: string;
  href: string;
  cta: string;
  featured: boolean;
  early: boolean;
};

export const workIntro = [
  "A useful product has to fit into someone's life. It needs to meet them at a moment when something is difficult, confusing, or taking more effort than it should, and give them a way forward.",
  "That is the thread connecting my work. The subjects vary, from online communities to scientific computing, but I keep returning to the same questions: who will use this, what are they trying to accomplish, and what would make the experience worth returning to?",
];

export const selectedWorkIntro =
  "The things I build tend to begin with something I want to make easier to understand or do. Sometimes that means helping someone keep a conversation, find their focus, or catch up with a community. Sometimes it means making a complicated research process easier to examine. These products are where that curiosity takes a practical form.";

export const projects = [
  {
    slug: "asteria",
    title: "Asteria",
    summary: "Ask the front desk about a room, then leave the booking with a person.",
    lede: "A hotel guest assistant that answers from the hotel's own facts, and lets the desk confirm the stay.",
    paragraphs: [
      "A guest arriving at a hotel site usually wants a simple answer: is there a room, what does it include, and how do I ask to stay. Asteria is that conversation for a fictional hotel. Guests browse a listing and talk with Leela about rooms, amenities, and policies. Photographs can come back with the reply, and a follow-up question does not require repeating the room name.",
      "When the stay needs exact dates or a guest count, the assistant asks for them. Availability, prices, and capacity stay in ordinary code, so a fluent reply cannot invent whether a room is free. A booking request goes to the desk with the guest's phone number. Staff confirm it, and the guest receives a reference in the same chat.",
      "Staff can also take over the thread, reply as the desk, and hand the conversation back. The model handles language. The hotel's inventory, policies, and confirmation stay with the people running the desk.",
    ],
    audience: "People exploring a guest assistant that stays inside a hotel's own information.",
    available:
      "A Next.js application. Live answers need a model key; without one it uses a rule-based interpreter. Bookings are confirmed by staff, not completed instantly by the guest. Demo data is not durable across server restarts.",
    image: {
      src: "/work/asteria.png",
      alt: "Leela, the hotel guest assistant, seated at a wooden reception desk",
      caption: "Leela at the front desk, as she appears in the guest listing. A fictional hotel, not a client property.",
      width: 1280,
      height: 720,
    },
    stack: ["Next.js", "TypeScript", "Vercel AI SDK", "Groq", "Zod"],
    demo: "https://aichatbot-cq21.vercel.app/",
    href: "https://github.com/RealBhupesh/Aichatbot",
    cta: "Explore Asteria and setup instructions",
    featured: true,
    early: false,
  },
  {
    slug: "fitness-dance-diet-coach",
    title: "Fitness Dance Diet Coach",
    summary: "Bring practice, feedback, and progress into the same place.",
    lede: "Bring practice, feedback, and progress into the same place.",
    paragraphs: [
      "Following a routine on a screen leaves an obvious question: am I doing it as intended? This coaching application explores a more responsive experience, connecting movement guidance with camera-based feedback and a record of previous sessions.",
      "It brings workout posture feedback, dance phrase guidance, coaching chat, and generated workout and nutrition plans into one application. A learner can follow a routine, review session feedback, and keep track of their progress. The review tools also expose camera confidence and the evidence behind feedback, so the interface can show the limits of what it observed.",
      "The aim is to make solo practice more understandable and give the next session a connection to the last one.",
    ],
    audience: "People exploring guided workouts and dance practice at home.",
    available:
      "A development-stage application. Live coaching still requires real-device camera validation; feedback is not medical assessment.",
    image: {
      src: "/work/fitness.png",
      alt: "Dance Coach screenshot showing a hip-hop starter routine with timing and movement guidance",
      caption: "Dance course screenshot from the repository. Class scores shown are demo content.",
      width: 841,
      height: 882,
    },
    stack: ["Next.js", "TypeScript", "MediaPipe", "Drizzle ORM", "Groq", "OpenAI", "Vitest", "Playwright"],
    href: "https://github.com/RealBhupesh/ai-fitness-coach",
    cta: "Explore the coaching application",
    featured: true,
    early: false,
  },
  {
    slug: "bell",
    title: "Bell",
    summary: "Help a Discord community stay organised and connected.",
    lede: "A companion for the everyday life of a Discord community.",
    paragraphs: [
      "An active server can be difficult to keep up with. Conversations move while people are away, moderation needs attention, and a community needs reasons for members to keep participating. Bell brings support for those moments into the place where the community already spends its time.",
      "Members can ask for a summary of recent conversation, catch up on a channel, set a reminder, or start a poll. Moderators can manage warnings, remove spam, control channels, and review moderation logs. Music and a persistent business simulation give members shared activities alongside the conversation.",
      "The value is in that continuity. Someone returning to the server has a way back into the discussion, and someone looking after it has practical tools close at hand.",
    ],
    audience: "Discord community owners, moderators, and members.",
    available:
      "A self-hosted bot, with provider credentials needed for optional AI and music integrations.",
    image: {
      src: "/work/bell.jpg",
      alt: "Colored pencil drawing of a brass bell in a sunlit window above a table set for a conversation",
      caption: "Illustration. A bell in the window, calling people back to the conversation.",
      width: 1280,
      height: 720,
    },
    signal: "50+ stars on GitHub.",
    stack: ["Python", "discord.py", "aiohttp", "OpenRouter", "Groq", "Spotify API", "FFmpeg"],
    href: "https://github.com/RealBhupesh/Bell-Agentic-Discord-Bot",
    cta: "Explore Bell and setup instructions",
    featured: true,
    early: false,
  },
  {
    slug: "beacon",
    title: "Beacon",
    displayTitle: "Beacon Uptime",
    summary: "Keep an eye on the websites you are responsible for.",
    lede: "Know when a website needs your attention.",
    paragraphs: [
      "When you are responsible for several websites, checking them manually soon becomes another job. A page can load while an API behind it fails, and knowing that something broke is only the beginning of understanding the incident.",
      "Beacon brings checks, alerts, and history together for a single operator managing up to ten sites. It discovers same-origin endpoints, checks APIs every minute, and supports a sandbox browser journey each hour. Incident and recovery emails tell you when the situation changes, while the dashboard keeps thirty days of availability and latency history.",
      "The product gives small-scale operations a repeatable way to notice problems and examine them, without relying on someone remembering to open every site.",
    ],
    audience: "Independent developers and operators maintaining a small group of sites.",
    available: "A self-hosted Cloudflare application, designed for one owner.",
    image: {
      src: "/work/beacon.jpg",
      alt: "Colored pencil drawing of a coastal beacon tower at sunset",
      caption: "Illustration. A beacon that keeps watch so you don't have to.",
      width: 1280,
      height: 720,
    },
    stack: ["TypeScript", "Cloudflare Workers", "Hono", "Drizzle ORM", "React", "Zod"],
    href: "https://github.com/RealBhupesh/beacon-uptime",
    cta: "Explore Beacon",
    featured: true,
    early: false,
  },
  {
    slug: "stockex",
    title: "STOCKEX",
    summary: "Give investment research a process you can question.",
    lede: "Make the reasoning behind investment research easier to inspect.",
    paragraphs: [
      "A persuasive stock thesis can make uncertainty disappear from view. The sources may be incomplete, the assumptions may be fragile, and the strongest argument against the idea may never have been considered. STOCKEX gives research a structure that keeps those questions present.",
      "The toolkit guides an assistant through gathering evidence, understanding the business, examining valuation, and testing risk. Templates make room for contradictory information and missing data. A local evidence store can assemble records available before a chosen cutoff, helping a researcher distinguish what was known then from what became clear later.",
      "For someone using an assistant to study Indian equities, the benefit is a more traceable process. They can return to the evidence, challenge an assumption, and understand why a conclusion changed.",
    ],
    audience: "People building structured, assistant-supported equity research workflows.",
    available:
      "A research toolkit and offline evidence store. Users supply data; it does not provide a live market feed or execute trades. Research support only, with no demonstrated return guarantee.",
    image: {
      src: "/work/stockex.jpg",
      alt: "STOCKEX cover artwork for Indian equity research",
      caption: "Repository cover artwork. The chart is illustrative, not a performance record.",
      width: 1672,
      height: 941,
    },
    stack: ["Python", "Agent harness", "Offline evidence store"],
    href: "https://github.com/RealBhupesh/stokex-research-harness-for-your-agents",
    cta: "Explore the research toolkit",
    featured: true,
    early: false,
  },
  {
    slug: "parley",
    title: "Parley",
    summary: "Keep the conversation, and the context that makes it meaningful.",
    lede: "Give a conversation somewhere to go next.",
    paragraphs: [
      "Sometimes the part of a conversation you need is buried in days of messages. Saving screenshots loses continuity; copying everything by hand takes patience. Parley lets you keep the conversation in a form that is easier to work with.",
      "Open a Discord chat in your browser, choose recent messages or a date range, and export it as Markdown, CSV, HTML, or PDF. You can include image references and choose a larger history when the context matters. Its ChatGPT handoff prepares the transcript in a new chat so you can add your question and decide when to send it.",
      "That makes Parley useful for preserving discussions, revisiting decisions, or asking for help with the full exchange in view. It reads the conversation without sending, editing, or deleting Discord messages.",
    ],
    audience: "People who want a usable copy of a Discord conversation.",
    available:
      "An extension installed manually in Chrome, Edge, or Brave. Works on browser Discord, one chat at a time.",
    image: {
      src: "/work/parley.jpg",
      alt: "Parley cover artwork showing Discord export options",
      caption: "Repository cover artwork.",
      width: 640,
      height: 360,
    },
    stack: ["TypeScript", "React", "Browser extension", "jsPDF"],
    href: "https://github.com/RealBhupesh/parley",
    cta: "Explore Parley and installation instructions",
    featured: false,
    early: false,
  },
  {
    slug: "physicore",
    title: "PhysiCore",
    summary: "An inspectable environment for experimenting with neural approaches to airflow.",
    lede: "An inspectable environment for experimenting with neural approaches to airflow.",
    paragraphs: [
      "Scientific software becomes more useful for learning when the path from inputs to results is visible. PhysiCore brings airfoil geometry, physical constraints, training, and field outputs into a research workflow that can be examined step by step.",
      "A researcher can configure a two-dimensional airfoil case, run a physics-controlled neural network, inspect the resulting fields, and export solution and mesh data for further analysis. The implementation includes its own differentiation engine, making the mathematical machinery available to study alongside the output.",
      "Its value is as a place to investigate an approach, compare assumptions, and extend the underlying method.",
    ],
    image: {
      src: "/work/physicore.png",
      alt: "Plot of a predicted airflow speed field around a two-dimensional airfoil",
      caption: "Sample speed field from the repository. Not a validated production benchmark.",
      width: 770,
      height: 495,
    },
    audience: "Students and researchers experimenting with scientific machine learning.",
    available:
      "A research and education-grade simulation core with a console and API. Production-level benchmark validation remains incomplete.",
    stack: ["Python", "NumPy", "SciPy", "FastAPI", "Custom autodiff"],
    href: "https://github.com/RealBhupesh/physicore-pcann",
    cta: "Explore PhysiCore",
    featured: false,
    early: false,
  },
  {
    slug: "aeroassist",
    title: "AeroAssist",
    summary: "Make aerodynamic ideas visible enough to explore.",
    lede: "Make aerodynamic ideas visible enough to explore.",
    paragraphs: [
      "Equations describe airflow, but it can be difficult to connect them to a shape and see what a changed assumption means. AeroAssist gives students and curious builders an interactive starting point.",
      "Choose a simplified vehicle or component, adjust parameters such as speed and angle of attack, and inspect estimated forces alongside a three-dimensional airflow view. Transparent formulas and a small two-dimensional flow solver provide the calculations behind the experience, while pressure and wake visualisations help make the results easier to discuss.",
      "It is a tool for developing intuition and exploring a workflow before moving into more demanding simulation work.",
    ],
    image: {
      src: "/work/aeroassist.jpg",
      alt: "Colored pencil drawing of a glider with airflow lines above green hills",
      caption: "Illustration. Not a result from the solver.",
      width: 1280,
      height: 720,
    },
    audience: "Students and builders exploring aerodynamic concepts.",
    available:
      "A local-first prototype for learning and concept screening. It is not a validated industrial solver; the current explanation layer uses deterministic mock responses.",
    stack: ["Python", "FastAPI", "NumPy", "TypeScript", "3D visualisation"],
    href: "https://github.com/RealBhupesh/aeroassist",
    cta: "Explore AeroAssist",
    featured: false,
    early: false,
  },
  {
    slug: "focus-timer",
    title: "Focus Timer",
    summary: "Give the next stretch of work a clear beginning and end.",
    lede: "Give the next stretch of work a clear beginning and end.",
    paragraphs: [
      "A large task is often easier to approach when the immediate commitment is smaller. Focus Timer gives that commitment a shape: choose a work interval, begin, and let the timer make room for a break.",
      "Custom session lengths, sound alerts, fullscreen mode, and keyboard controls let the experience fit the way someone works. Themes and backgrounds make the space their own, while locally saved statistics preserve a record of completed sessions and focus time.",
      "It is a small tool built around a repeatable action: making time for the next piece of work.",
    ],
    image: {
      src: "/work/focus-timer.png",
      alt: "Focus Timer showing a 25-minute Pomodoro session with stopwatch, timer, and countdown modes",
      caption: "The live app, in Pomodoro mode.",
      width: 1280,
      height: 720,
    },
    audience: "Students, developers, and anyone who likes working in timed sessions.",
    available: "A browser application with settings and statistics saved locally.",
    stack: ["React", "TypeScript"],
    demo: "https://advtimer.vercel.app/",
    href: "https://github.com/RealBhupesh/focus-timer",
    cta: "Explore Focus Timer",
    featured: false,
    early: false,
  },
  {
    slug: "watchai",
    title: "WatchAI",
    summary: "Replies that fit the moment, on your wrist.",
    lede: "Replies that fit the moment, on your wrist.",
    paragraphs: [
      "WatchAI explores whether a CMF Watch Pro 2 can offer context-aware quick replies to incoming messages. The reply engine already generates short options in casual English, Hinglish, or a professional tone. Watch communication is still being investigated, and the Android application is not yet built. The intended product is a less disruptive way to respond when taking out a phone would interrupt what you are doing.",
    ],
    image: {
      src: "/work/watchai.jpg",
      alt: "Colored pencil drawing of a wristwatch resting on a windowsill",
      caption: "Illustration. The watch application is not built yet.",
      width: 1280,
      height: 720,
    },
    stack: ["Python"],
    href: "https://github.com/RealBhupesh/CMF-WATCH-AI",
    cta: "Follow the WatchAI exploration",
    featured: false,
    early: true,
  },
] as const satisfies readonly Project[];

export type ProjectSlug = (typeof projects)[number]["slug"];

export type ProjectEntry = (typeof projects)[number];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function titleOf(project: ProjectEntry) {
  return "displayTitle" in project && project.displayTitle ? project.displayTitle : project.title;
}

export function nextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
