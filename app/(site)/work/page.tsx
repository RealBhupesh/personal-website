import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { GitHubContributionActivity } from "@/components/github-contribution-activity";
import { getGitHubContributions } from "@/lib/github-contributions";
import { titleOf, workGroups, workIntro, workProjects, type ProjectEntry } from "@/config/work";
import { breadcrumbJsonLd, pageMetadata, workListJsonLd } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Work",
  description:
    "Projects by Bhupesh Cholake: AI applications, developer tools, scientific computing, and work in progress. Read the decisions behind each project, try a demo, or explore the source.",
  path: "/work",
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

function WorkRow({ project }: { project: ProjectEntry }) {
  return (
    <li>
      <h3 className="font-medium">
        <Link href={`/work/${project.slug}`} className={textLink}>
          {titleOf(project)}
        </Link>
      </h3>
      <p className="mt-1 leading-[1.7]">{project.summary}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {project.status}. {project.stack.slice(0, 4).join(" · ")}
      </p>
      {"demo" in project && project.demo ? (
        <p className="mt-2 text-sm">
          <a href={project.demo} className={textLink} rel="noreferrer" target="_blank">
            Try {titleOf(project)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      ) : null}
    </li>
  );
}

export const revalidate = 3600;

export default async function WorkPage() {
  const { projects: contributions, mergedPrCount, stale, updatedAt } = await getGitHubContributions();
  return (
    <div>
      <JsonLd data={workListJsonLd(workProjects)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Work", path: "/work" }])} />
      <header>
        <h1 className="section-title">Work</h1>
        <div className="mt-4 space-y-4">
          {workIntro.map((paragraph) => (
            <p key={paragraph} className="leading-[1.75]">
              {paragraph}
            </p>
          ))}
        </div>
      </header>
      <nav aria-label="Project collections" className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {workGroups.map((group) => (
          <a key={group.id} href={`#${group.id}`} className={textLink}>
            {group.title}
          </a>
        ))}
      </nav>
      <section className="mt-10" aria-labelledby="github-activity-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="github-activity-heading" className="section-title">GitHub contributions</h2>
          <p className="text-sm text-muted">{mergedPrCount} merged PRs</p>
        </div>
        <GitHubContributionActivity projects={contributions} />
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Public pull requests to other people&apos;s repositories, with their current status.
          {stale ? ` Saved list from ${updatedAt.slice(0, 10)} while GitHub is unavailable.` : " Updated automatically from GitHub."}
        </p>
        <p className="mt-2 text-sm">
          <Link href="/about#open-source" className={textLink}>Every pull request, with links</Link>
        </p>
      </section>
      <div className="mt-12 space-y-14">
        {workGroups.map((group) => {
          const collection = workProjects.filter((project) => project.group === group.id);
          return (
            <section key={group.id} id={group.id} className="scroll-mt-8" aria-labelledby={`${group.id}-heading`}>
              <h2 id={`${group.id}-heading`} className="text-xl font-medium tracking-[-0.02em]">
                {group.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{group.description}</p>
              <ul className="mt-6 space-y-8">
                {collection.map((project) => (
                  <WorkRow key={project.slug} project={project} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
