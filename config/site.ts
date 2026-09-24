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
    "Bhupesh Cholake builds AI applications and has merged open-source work in Cloudflare, Sentry, and Grafana. Software engineer seeking an AI engineer role.",
  url: "https://www.bhupeessh.in",
  email: "work.bhupesh@gmail.com",
  github: "https://github.com/RealBhupesh",
  linkedin: "https://www.linkedin.com/in/thebhupesh/",
  x: "https://x.com/bhupeshcholake",
  bio: `I'm a software engineer in Nashik who builds AI applications people can rely on. Most recently I was a founding engineer intern at Physicore Engine, where I built a physics solver that runs in the browser.

I also work in other people's codebases. My changes have been merged into Cloudflare's Workers SDK, Sentry, Grafana Faro, Gumroad, and Nanocoder, an open-source AI coding agent.

I'm looking for an AI engineer role.`,
  bioLong: `Long before I knew what I wanted to do for a living, I knew what could hold my attention for hours: technology, and the possibility of making something with it.

Growing up in Nashik, that curiosity kept finding new forms. I started a YouTube channel about tech. I began learning programming and web development. By 11th standard, I had started my own agency. Each step brought something that had once felt distant a little closer: I could learn how it worked, try it myself, and put something of my own into the world.

Starting early gave my curiosity somewhere to go. A website became a reason to understand design. An agency became a reason to think about business. An unfamiliar problem became a reason to learn. I began to see how much was connected, and how much more there was to understand.

I went on to pursue a degree in Artificial Intelligence and Data Science. When I first had access to ChatGPT, I saw the possibility of attempting ideas I had previously struggled to bring within reach. It expanded the scale of what I wanted to build, and made me more interested in the judgment behind the work: choosing the problem, asking better questions, and knowing whether the result deserved someone's trust.

That interest has taken me well beyond programming.

I want to understand why people choose one product over another. Why a useful idea can struggle to find its audience. Why someone holds on to a familiar way of doing things, even when another option seems better to the person who built it. Those questions have drawn me toward marketing, psychology, and strategy, and toward a more careful way of looking at people.

A person arrives at a product with a world already in their head. They have habits, expectations, pressures, and reasons to be cautious. I want to understand that world before asking them to change anything about it. For me, empathy means doing the work of seeing a problem from their position, including the parts that are easy to overlook from mine.

That also shapes how I think about startups. I want to understand who a business intends to serve, what change it promises, and why people would choose to participate. I am interested in the decisions that give an idea a chance to endure: where to begin, what to leave out, how to earn trust, and what can become more valuable with time.

I am drawn to systems for a similar reason. A well-designed process can carry a lesson forward. A useful tool can remove a problem each time it appears. I like building things that make the next effort more effective, and I am trying to bring that same intention to how I learn, work, and live.

When a problem gets hold of me, I find it difficult to leave it at a surface understanding. I want to follow it far enough to see what is actually happening. That can mean learning a new tool, reconsidering an assumption, or stepping into a part of the work I have never done before. I am willing to begin without knowing everything the task will require of me.

Once I commit, I want to be responsible for moving the work forward. I will ask questions, work through unfamiliar territory, and change my approach when the evidence calls for it. Difficulty gives me something to investigate; it does not settle the question of what I can do.

That is the person I am working to become: someone whose curiosity develops into understanding, and whose understanding becomes something other people can use.

The thread running through all of it is the same one that drew me to technology as a child. I want to understand enough to make a difference, and become capable enough to act on it.`,
  nowUpdated: "September 2026",
  now: [
    {
      label: "Building",
      text: "STOCKEX, a research harness that gives AI agents a traceable process for equity research, alongside work on agent evaluation and websites through Redowl Studio.",
    },
    {
      label: "Contributing",
      text: "Fixes to developer tools and SDKs, most recently Cloudflare's Workers SDK, Grafana Faro, and Plane.",
    },
    {
      label: "Studying",
      text: "Strategy, human behaviour, and the choices that help a product find its place in people's lives.",
    },
    {
      label: "Looking for",
      text: "An AI engineer role where I can own problems end to end, from the model's behaviour to the product around it.",
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
