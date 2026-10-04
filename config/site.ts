/**
 * Edit this file to change personal details without touching the UI.
 * Bio, links, current work, navigation, experience, and education all live here.
 */

export type NowItem = {
  label: string;
  text: string;
};

export type NavItem = {
  href: string;
  label: string;
};

export const site = {
  name: "Bhupesh Cholake",
  title: "Bhupesh Cholake · Software engineer building AI applications",
  description:
    "Bhupesh Cholake is a software engineer in Nashik building AI applications, developer tools, and scientific software, with merged work in Cloudflare, Sentry, and Grafana.",
  url: "https://www.bhupeessh.in",
  email: "work.bhupesh@gmail.com",
  github: "https://github.com/RealBhupesh",
  linkedin: "https://www.linkedin.com/in/thebhupesh/",
  x: "https://x.com/bhupeshcholake",
  bio: `I'm Bhupesh, a software engineer in Nashik. I build AI applications, from the tools a model calls to the interface someone uses to work with it.

Recently, I was a founding engineer intern at Physicore Engine, building a Python physics solver and its browser interface. Outside that work, I've built a hotel guest assistant, a Discord bot, and tools for monitoring websites and studying airflow.

I also contribute to codebases other people depend on, including Cloudflare's Workers SDK, Sentry, Grafana, and Nanocoder. I'm looking for an AI engineer role where I can follow a problem from the first question through to a working product.`,
  bioLong: `Technology caught my attention long before I knew what kind of work I wanted to do. Growing up in Nashik, I started a YouTube channel about tech, learned to build websites, and started my own agency by 11th standard. Each attempt gave me a new question to follow.

A website made me curious about design. Running an agency made me think about why someone chooses one business over another. Programming gave me a way to turn an idea into something I could put in front of a person and learn from.

I went on to study Artificial Intelligence and Data Science. When I first used ChatGPT, ideas that had felt out of reach became things I could attempt. That made me more ambitious about what I could build, and more interested in how to tell whether it worked well enough to trust.

That question has stayed with me. In Asteria, the model can help a guest find a room, but code checks the inventory and staff confirm the booking. In PhysiCore, a predicted airflow field matters alongside the equations, derivatives, and assumptions that produced it. I like being able to follow an answer back to the machinery behind it.

I learn from other people's machinery, too. Working on Nanocoder meant finding where oversized tool results and diffs could overwhelm an agent's context. Contributions to Cloudflare, Sentry, and Grafana have put me inside systems with existing users, constraints, and maintainers. A useful fix has to fit all three.

My curiosity also takes me beyond code. I read about strategy, psychology, and marketing because a working product still has to find a place in someone's life. People bring habits, pressures, and reasons to be cautious. I want to understand those before asking them to change how they work.

I'm drawn to tools and processes that carry a lesson forward: a check that catches the same mistake next time, a workflow that makes the next decision clearer, a small piece of software that removes a recurring job. Building them has become a way of making my own learning useful to someone else.

I'm looking for an AI engineer role where I can take responsibility for that whole process. I enjoy the point where a problem stops being familiar: there is something to investigate, a new skill to learn, and a chance to make a better decision than I could have made yesterday.`,
  nowUpdated: "October 2026",
  now: [
    {
      label: "Building",
      text: "Relay, a resumable coding-agent harness, alongside STOCKEX research workflows and websites through Redowl Studio.",
    },
    {
      label: "Contributing",
      text: "Fixes to developer tools and SDKs, including Cloudflare’s Workers SDK, Grafana Faro, Plane, and Nanocoder.",
    },
    {
      label: "Studying",
      text: "Strategy, psychology, and why useful products become part of someone’s routine.",
    },
    {
      label: "Looking for",
      text: "An AI engineer role with responsibility for the model’s behaviour, the application around it, and the person using it.",
    },
  ] satisfies NowItem[],
  navigation: [
    { href: "/work", label: "Work" },
    { href: "/blog", label: "Writing" },
    { href: "/notes", label: "Notes" },
    { href: "/about", label: "About" },
  ] satisfies NavItem[],
  education: [
    {
      title: "Bachelor of Engineering, Artificial Intelligence & Data Science",
      detail:
        "CGPA 8.6/10. Coursework in Machine Learning, Data Structures and Algorithms, and Business Intelligence.",
    },
  ],
} as const;
