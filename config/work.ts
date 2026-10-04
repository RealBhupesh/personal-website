export type WorkImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type ProjectGroup = "applications" | "tools" | "research" | "explorations";

export type Project = {
  group: ProjectGroup;
  status: string;
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
  "I build AI applications, tools for developers, and experiments in scientific computing. These projects show the problems I chose, the systems I built, and the decisions behind them.",
  "You can try the live demos, read the code, or follow a project from its first question to its current limits.",
];

export const selectedWorkIntro =
  "Four projects that show my work across AI applications, developer tools, and scientific computing.";

export const workGroups = [
  { id: "applications", title: "AI applications", description: "Putting models to work in conversations, communities, and coaching." },
  { id: "tools", title: "Developer tools", description: "Monitoring websites, preserving conversations, and making time for focused work." },
  { id: "research", title: "Research and simulation", description: "Making the path from evidence and equations to a result easier to inspect." },
  { id: "explorations", title: "In progress", description: "The questions I am working through next, with the current state made clear." },
] as const satisfies readonly { id: ProjectGroup; title: string; description: string }[];

export const projects = [
  {
    group: "applications",
    status: "Self-hosted bot",
    slug: "bell",
    title: "Bell",
    summary: "A Discord bot for conversation summaries, moderation, reminders, and shared activities.",
    lede: "A Discord bot that helps people catch up and gives moderators the tools to keep a community running.",
    paragraphs: [
      "A Discord server keeps talking while you are away. Bell gives returning members a way back in: ask for a summary, catch up on a channel, or set a reminder without leaving the server. I built the bot in Python, with AI providers connected through its command interface.",
      "Moderators can manage warnings, remove spam, control channels, and review a log of what happened. Members can run polls, play music, and take part in a persistent business simulation. The bot brings those jobs into the same place as the conversation.",
      "AI is useful for summarising a discussion. Moderation commands and stored warnings need predictable behaviour. Bell combines both, with optional provider integrations and a self-hosted setup. The repository has earned more than 50 GitHub stars.",
    ],
    audience: "Discord community members, owners, and moderators.",
    available: "Self-hosted Python bot. Optional AI and music features require provider credentials.",
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
    cta: "Read Bell’s source and setup guide",
    featured: true,
    early: false,
  },
  {
    group: "applications",
    status: "Live demo",
    slug: "asteria",
    title: "Asteria",
    summary: "A hotel guest assistant with real availability checks and a handoff to the front desk.",
    lede: "An AI hotel assistant that can answer a guest's questions without inventing a room to put them in.",
    paragraphs: [
      "A guest has a few practical questions before booking: is there a room, does it fit everyone, and what is included? I built Asteria around that conversation. Guests explore a fictional hotel and talk to Leela, an assistant that answers from its room details, photographs, and policies.",
      "The model handles the conversation. Code checks the dates, capacity, price, and inventory. When a guest wants to stay, Leela collects the details and sends a booking request to the front desk. Staff confirm the reservation; the guest gets a reference in the same chat.",
      "I built a staff console for inventory changes and conversation takeover, too. The distinction matters: answering a question, checking availability, and confirming a booking are different actions. The interface makes that clear to both the guest and the person at the desk.",
    ],
    audience: "Hotel guests and staff exploring an AI front desk.",
    available: "A live demo for a fictional hotel. Staff confirm bookings. A model key enables live AI replies; a rule-based fallback works without one. Demo records reset on server restart.",
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
    cta: "Read the code and setup guide",
    featured: true,
    early: false,
  },
  {
    group: "applications",
    status: "Development prototype",
    displayTitle: "AI Fitness Coach",
    slug: "fitness-dance-diet-coach",
    title: "Fitness Dance Diet Coach",
    summary: "Camera-based workout and dance feedback, with coaching chat and session history.",
    lede: "A coaching prototype that connects what the camera sees to what a learner can do next.",
    paragraphs: [
      "A workout video can show you a movement, but it cannot tell you what your own body is doing. I built this application to explore that missing feedback: camera-based posture tracking, dance guidance, and a record of each practice session.",
      "MediaPipe supplies pose landmarks. The application turns those observations into movement feedback and keeps session history alongside coaching chat, workout plans, and nutrition plans. Review tools expose camera confidence and the observations behind a score, so the learner can see where the feedback comes from.",
      "The next step is real-device validation. A camera can lose track of a joint or misread a movement, and the coaching has to handle those gaps. The application is a development prototype; its feedback is not a medical assessment.",
    ],
    audience: "People practising workouts and dance routines at home.",
    available: "Development prototype. Camera feedback still needs validation on real devices; the scores in the screenshot are demo content.",
    image: {
      src: "/work/fitness.png",
      alt: "Dance Coach screenshot showing a hip-hop starter routine with timing and movement guidance",
      caption: "Dance course screenshot from the repository. Class scores shown are demo content.",
      width: 841,
      height: 882,
    },
    stack: ["Next.js", "TypeScript", "MediaPipe", "Drizzle ORM", "Groq", "OpenAI", "Vitest", "Playwright"],
    href: "https://github.com/RealBhupesh/ai-fitness-coach",
    cta: "Read the coaching application source",
    featured: false,
    early: false,
  },
  {
    group: "tools",
    status: "Self-hosted application",
    slug: "beacon",
    title: "Beacon",
    displayTitle: "Beacon Uptime",
    summary: "Uptime monitoring with API checks, browser journeys, and incident and recovery emails.",
    lede: "An uptime monitor that checks what a website does, as well as whether it loads.",
    paragraphs: [
      "A homepage can load while the API behind it fails. I built Beacon for one person managing a small group of websites, with checks that reach beyond the front page. It monitors up to ten sites on Cloudflare.",
      "Beacon discovers same-origin endpoints, checks APIs every minute, and runs a sandbox browser journey each hour. It sends incident and recovery emails, groups related failures, and keeps thirty days of availability and latency history in D1.",
      "The dashboard gives the operator somewhere to investigate: what failed, when it started, and whether it recovered. Alerts are deduplicated, so a continuing outage does not become a continuing stream of the same email.",
    ],
    audience: "Independent developers maintaining up to ten websites.",
    available: "Self-hosted Cloudflare application for a single owner.",
    image: {
      src: "/work/beacon.jpg",
      alt: "Colored pencil drawing of a coastal beacon tower at sunset",
      caption: "Illustration. A beacon that keeps watch so you don't have to.",
      width: 1280,
      height: 720,
    },
    stack: ["TypeScript", "Cloudflare Workers", "Hono", "Drizzle ORM", "React", "Zod"],
    href: "https://github.com/RealBhupesh/beacon-uptime",
    cta: "Read Beacon’s source and deployment guide",
    featured: true,
    early: false,
  },
  {
    group: "tools",
    status: "Browser extension",
    slug: "parley",
    title: "Parley",
    summary: "Export a Discord conversation to Markdown, CSV, HTML, or PDF, with the speakers and context intact.",
    lede: "A browser extension for keeping a Discord conversation in a form you can actually use.",
    paragraphs: [
      "The useful part of a conversation can be buried in days of messages. Screenshots keep fragments; copying a thread by hand is slow. I built Parley to export the conversation itself, including who said what and when.",
      "Open a Discord chat in Chrome, Edge, or Brave. Choose recent messages, a date range, or the full chat, then export to Markdown, CSV, HTML, or PDF. Image references can be included when they help preserve the context.",
      "Parley can also prepare the transcript in a new ChatGPT chat. It leaves the question and the final send to you. The extension reads one browser conversation at a time and does not send, edit, or delete Discord messages.",
    ],
    audience: "People saving discussions, revisiting decisions, or working with a chat transcript.",
    available: "Manually installed extension for Chrome, Edge, and Brave. Works with browser Discord, one conversation at a time.",
    image: {
      src: "/work/parley.jpg",
      alt: "Parley cover artwork showing Discord export options",
      caption: "Repository cover artwork.",
      width: 640,
      height: 360,
    },
    stack: ["TypeScript", "React", "Browser extension", "jsPDF"],
    href: "https://github.com/RealBhupesh/parley",
    cta: "Read the source and installation guide",
    featured: false,
    early: false,
  },
  {
    group: "tools",
    status: "Live application",
    slug: "focus-timer",
    title: "Focus Timer",
    summary: "A Pomodoro timer with custom sessions, keyboard controls, and a locally saved record of focused work.",
    lede: "A small browser tool for committing to the next stretch of work.",
    paragraphs: [
      "Sometimes the useful commitment is simply twenty-five minutes. I built Focus Timer around that small starting point: choose a work interval, begin, and let the timer make room for a break.",
      "You can change the session lengths, use sound alerts, work fullscreen, or control the timer from the keyboard. Settings and statistics are saved locally, so the next visit picks up with your preferences and a record of completed sessions.",
    ],
    image: {
      src: "/work/focus-timer.png",
      alt: "Focus Timer showing a 25-minute Pomodoro session with stopwatch, timer, and countdown modes",
      caption: "The live app, in Pomodoro mode.",
      width: 1280,
      height: 720,
    },
    audience: "Anyone who likes working in timed sessions.",
    available: "Live browser application. Settings and focus statistics are stored locally.",
    stack: ["React", "TypeScript"],
    demo: "https://advtimer.vercel.app/",
    href: "https://github.com/RealBhupesh/focus-timer",
    cta: "Read the timer source",
    featured: false,
    early: false,
  },
  {
    group: "research",
    status: "Research prototype",
    slug: "physicore",
    title: "PhysiCore",
    summary: "A neural airfoil solver built with a custom differentiation engine, a console, and a simulation API.",
    lede: "An airfoil simulation core where the derivatives, physical constraints, and predicted fields are open to inspection.",
    paragraphs: [
      "Airflow simulation brings geometry, equations, and numerical methods into the same problem. PhysiCore explores a neural approach to steady, two-dimensional airfoil flow, predicting velocity and pressure while training against physical constraints.",
      "The environment had NumPy but no PyTorch or JAX, so I built a differentiation engine. It computes the spatial derivatives needed for the physics residuals and propagates gradients through training. A console and API let a researcher configure an airfoil case, inspect the fields, and export solution and mesh data.",
      "That makes the method itself available to study, alongside its output. The core includes checks against finite-difference derivatives, but production benchmark validation is incomplete. I present it as a research and education tool.",
    ],
    image: {
      src: "/work/physicore.png",
      alt: "Plot of a predicted airflow speed field around a two-dimensional airfoil",
      caption: "Sample speed field from the repository. Not a validated production benchmark.",
      width: 770,
      height: 495,
    },
    audience: "Students and researchers working with scientific machine learning.",
    available: "Research prototype with a console and API. Derivative checks are implemented; production benchmark validation remains incomplete.",
    stack: ["Python", "NumPy", "SciPy", "FastAPI", "Custom autodiff"],
    href: "https://github.com/RealBhupesh/physicore-pcann",
    cta: "Read the solver and differentiation engine",
    featured: true,
    early: false,
  },
  {
    group: "research",
    status: "Research toolkit",
    slug: "stockex",
    title: "STOCKEX",
    summary: "An equity research workflow for AI agents, with an evidence store and checks on their conclusions.",
    lede: "A research toolkit that keeps the sources, assumptions, and opposing evidence attached to a stock thesis.",
    paragraphs: [
      "A convincing investment thesis is easy to read and harder to question. STOCKEX gives an AI assistant a structured way to research Indian equities, keeping track of the evidence behind the answer and what is still missing.",
      "The workflow covers the business, valuation, risks, and catalysts, then asks for a skeptical review. Templates make room for contradictory information. An offline evidence store can assemble records available before a chosen date, keeping later knowledge out of an earlier research question.",
      "I built it as a set of reusable workflows and tools. A researcher supplies the data and can trace a conclusion back to its sources. It supports research; it does not supply a live market feed, execute trades, or establish that a strategy will earn a return.",
    ],
    audience: "Researchers building AI-assisted workflows for Indian equities.",
    available: "Research toolkit with an offline evidence store. Users supply the data. No live market feed, trade execution, or demonstrated investment performance.",
    image: {
      src: "/work/stockex.jpg",
      alt: "STOCKEX cover artwork for Indian equity research",
      caption: "Repository cover artwork. The chart is illustrative, not a performance record.",
      width: 1672,
      height: 941,
    },
    stack: ["Python", "Agent harness", "Offline evidence store"],
    href: "https://github.com/RealBhupesh/stokex-research-harness-for-your-agents",
    cta: "Read the research workflow and tools",
    featured: false,
    early: false,
  },
  {
    group: "research",
    status: "Learning prototype",
    slug: "aeroassist",
    title: "AeroAssist",
    summary: "Interactive aerodynamic estimates and 3D airflow visualisation, backed by a small 2D solver.",
    lede: "A place to change an aerodynamic parameter and see what happens to the estimated forces and airflow.",
    paragraphs: [
      "An equation for drag becomes easier to understand when you can change the speed or shape and see the result. AeroAssist is a local prototype for exploring that connection, using simplified vehicles and components.",
      "Adjust speed, density, geometry, and angle of attack, then inspect estimated forces beside a 3D airflow view. The backend combines transparent engineering formulas with a small two-dimensional pressure-projection solver. Pressure and wake views help connect the numbers to a physical picture.",
      "The purpose is learning and early concept exploration. Industrial accuracy has not been validated, and the explanation layer currently uses deterministic mock responses. The solver interface leaves a path for a more capable numerical backend later.",
    ],
    image: {
      src: "/work/aeroassist.jpg",
      alt: "Colored pencil drawing of a glider with airflow lines above green hills",
      caption: "Illustration. Not a result from the solver.",
      width: 1280,
      height: 720,
    },
    audience: "Students and builders learning aerodynamic concepts.",
    available: "Local prototype with a small 2D solver. Industrial accuracy is unvalidated; the explanation layer uses mock responses.",
    stack: ["Python", "FastAPI", "NumPy", "TypeScript", "3D visualisation"],
    href: "https://github.com/RealBhupesh/aeroassist",
    cta: "Read the prototype and solver code",
    featured: false,
    early: false,
  },
  {
    group: "explorations",
    status: "In development",
    slug: "relay",
    title: "Relay",
    summary: "An agent harness with resumable tasks, isolated Git worktrees, and a record of what each run did.",
    lede: "An agent harness designed to keep its place when a long coding task stops and starts again.",
    paragraphs: [
      "A long agent run needs more than a prompt. It needs a plan, a record of completed work, and a way to recover when a process stops. Relay is my current work on that infrastructure.",
      "Tasks have executable acceptance criteria. The harness runs them in isolated Git worktrees, saves checkpoints and traces, and exposes commands to resume a run or answer a blocked task. Adapters connect to model APIs and the official Claude and Codex CLIs.",
      "The current milestones have been verified with offline runs. Live subscription behaviour, speed, and token savings are still unmeasured. The next step is a bounded run against a real downstream objective.",
    ],
    audience: "Developers exploring longer-running coding agents.",
    available: "In development. Offline milestones are verified; live provider performance and downstream use still need validation.",
    stack: ["TypeScript", "Node.js", "SQLite", "Git worktrees"],
    href: "https://github.com/RealBhupesh/harness",
    cta: "Read Relay’s current implementation",
    featured: false,
    early: true,
  },
  {
    group: "explorations",
    status: "Protocol research",
    audience: "An exploration of less disruptive messaging on a smartwatch.",
    available: "Reply engine and Bluetooth investigation tools. Watch communication is under investigation; the Android app is not built.",
    slug: "watchai",
    title: "WatchAI",
    summary: "Exploring context-aware quick replies on a CMF Watch Pro 2 through Bluetooth protocol research.",
    lede: "Can a watch offer a useful reply without making you reach for your phone?",
    paragraphs: [
      "WatchAI starts with a hardware question: can the phone write new quick replies to a CMF Watch Pro 2, and can it learn which reply was tapped? That determines whether the intended product can work.",
      "The repository includes a Python reply engine and tools for investigating Bluetooth communication. The engine generates short suggestions in casual English, Hinglish, or a professional tone. The Android application is not built yet; the current work is on the protocol and its feasibility.",
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
    cta: "Follow the protocol research",
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

/** The homepage selection is ordered deliberately, independent of the catalogue. */
const selectedSlugs = ["bell", "asteria", "beacon", "physicore"] as const satisfies readonly ProjectSlug[];

export const featuredProjects = selectedSlugs.map((slug) => {
  const project = getProject(slug);
  if (!project) throw new Error(`Unknown selected project: ${slug}`);
  return project;
});

export const workProjects = workGroups.flatMap((group) =>
  projects.filter((project) => project.group === group.id),
);

export function nextProject(slug: string) {
  const index = workProjects.findIndex((project) => project.slug === slug);
  return workProjects[(index + 1) % workProjects.length];
}
