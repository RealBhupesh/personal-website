import { roles, skills } from "@/config/experience";
import { getFaqs, profile } from "@/config/profile";
import { getGitHubContributions, projectCounts, type ContributionProject } from "@/lib/github-contributions";
import { site } from "@/config/site";
import { projects, titleOf } from "@/config/work";
import { getNotes, getPosts } from "@/lib/content";

type Contributions = Awaited<ReturnType<typeof getGitHubContributions>>;

function roleLine(role: (typeof roles)[number]) {
  const period = role.period ? ` (${role.period})` : "";
  return `- ${role.title}, ${role.org}${period}: ${role.summary}`;
}

function projectLine(project: (typeof projects)[number]) {
  const demo = project.demo ? ` Live demo: ${project.demo}.` : "";
  return `- [${titleOf(project)}](${site.url}/work/${project.slug}): ${project.summary} Status: ${project.status}. Built with ${project.stack.join(", ")}. Source: ${project.href}.${demo}`;
}

function contributionLine(item: ContributionProject) {
  return `- ${item.project} (${item.repo}): ${item.summary || item.about} ${projectCounts(item)}.`;
}

function renderIndex(data: Contributions) {
  const { projects: contributions, mergedPrCount, totalPrCount, updatedAt, stale } = data;
  const posts = getPosts().filter(post => !post.draft);
  const notes = getNotes().filter(note => !note.draft);
  return `# ${site.name}

> ${site.description}

Public portfolio and writing by ${site.name}. Canonical website: ${site.url}/. Profile reviewed ${profile.updated}. The linked case studies and GitHub pull requests provide the sources for project and contribution claims. Counts describe pull requests, not commits.

## Identity

- Name: ${site.name}
- Headline: ${profile.headline}
- Based in: ${profile.location}
- Education: ${profile.education}
- Looking for: ${profile.seeking}
- Email: ${site.email}
- GitHub: ${site.github}
- LinkedIn: ${site.linkedin}
- X: ${site.x}

## Experience

${roles.map(roleLine).join("\n")}

## Open source

${mergedPrCount} merged pull requests. ${totalPrCount} total public pull requests across ${contributions.length} projects maintained by others. ${stale ? "Saved snapshot" : "GitHub data"} checked ${updatedAt}. Statuses distinguish merged, open, and closed without merge. Individual evidence: ${site.url}/about#open-source.

${contributions.map(contributionLine).join("\n")}

## Projects

${projects.map(projectLine).join("\n")}

## Skills

${skills.map(group => `- ${group.label}: ${group.items.join(", ")}`).join("\n")}

## Writing

${posts.map(post => `- [${post.title}](${site.url}/blog/${post.slug}): ${post.description} Published ${post.date}${post.updated ? `; updated ${post.updated}` : ""}.`).join("\n") || "No published essays."}
${notes.length ? `\n## Notes\n\n${notes.map(note => `- [${note.title}](${site.url}/notes/${note.slug}): ${note.description}`).join("\n")}\n` : ""}
## Pages

- [About](${site.url}/about): Experience, education, skills, contact, and individual contribution evidence.
- [Work](${site.url}/work): Technical case studies, project limitations, demos, and source code.
${posts.length ? `- [Writing](${site.url}/blog): Published essays.\n` : ""}${notes.length ? `- [Notes](${site.url}/notes): Short observations.\n` : ""}- [Full text](${site.url}/llms-full.txt): Public biography, project case studies, all published essays and notes, and pull-request evidence in one text document.
- [RSS feed](${site.url}/feed.xml): Published essays and canonical URLs.
- [Sitemap](${site.url}/sitemap.xml): Indexable public HTML pages.
`;
}

export async function llmsTxt() {
  return renderIndex(await getGitHubContributions());
}

export async function llmsFullTxt() {
  const data = await getGitHubContributions();
  const { projects: contributions, mergedPrCount } = data;
  const faqs = getFaqs(mergedPrCount, contributions.filter(item => item.mergedCount > 0).length);
  const work = projects.map(project => `### ${titleOf(project)}

Canonical URL: ${site.url}/work/${project.slug}

${project.lede}

${project.paragraphs.join("\n\n")}

Status: ${project.status}
${project.available ? `Availability and limits: ${project.available}\n` : ""}${project.audience ? `Audience: ${project.audience}\n` : ""}Built with: ${project.stack.join(", ")}
Source: ${project.href}
${project.demo ? `Live demo: ${project.demo}\n` : ""}`).join("\n");

  const experience = roles.map(role => `### ${role.title}, ${role.org}${role.period ? ` (${role.period})` : ""}\n\n${role.summary}\n\n${role.points.map(point => `- ${point}`).join("\n")}`).join("\n\n");
  const questions = faqs.map(item => `### ${item.question}\n\n${item.answer}`).join("\n\n");
  const writing = getPosts().filter(post => !post.draft).map(post => `### ${post.title}

Canonical URL: ${site.url}/blog/${post.slug}
Author: ${site.name} (${site.url}/about)
Published: ${post.date}
${post.updated ? `Updated: ${post.updated}\n` : ""}Topics: ${post.tags.join(", ")}

${post.description}

${post.body}
`).join("\n");
  const notes = getNotes().filter(note => !note.draft).map(note => `### ${note.title}\n\nCanonical URL: ${site.url}/notes/${note.slug}\nAuthor: ${site.name}\n\n${note.description}\n\n${note.body}\n`).join("\n");
  const evidence = contributions.map(item => `### ${item.project}\n\n${item.prs.map(pr => `- ${pr.title}: ${pr.url} (${pr.status}${pr.attribution ? `; ${pr.attribution}; evidence: ${pr.evidence}` : ""})`).join("\n")}`).join("\n\n");

  return `${renderIndex(data)}
## About, in his words

Canonical URL: ${site.url}/about

${site.bio}

## Longer story

${site.bioLong}

## Experience in detail

${experience}

## Questions

${questions}

## Work in detail

${work}

## Published essays in full

${writing || "No published essays."}
${notes ? `\n## Published notes in full\n\n${notes}\n` : ""}
## Pull-request evidence

${evidence}
`;
}
