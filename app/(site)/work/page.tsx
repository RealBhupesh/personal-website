import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { projects, titleOf, workIntro, type ProjectEntry } from "@/config/work";
import { breadcrumbJsonLd, pageMetadata, workListJsonLd } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Work",
  description:
    "AI applications and developer tools built by Bhupesh Cholake, including a hotel guest assistant, a real-time fitness coach, and an agentic Discord bot.",
  path: "/work",
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

function WorkRow({ project, heading: Heading }: { project: ProjectEntry; heading: "h2" | "h3" }) {
  return (
    <li className="border-t border-border py-6">
      <Heading className="font-medium">
        <Link href={`/work/${project.slug}`} className={textLink}>
          {titleOf(project)}
        </Link>
      </Heading>
      <p className="mt-1 leading-[1.7]">{project.lede}</p>
      <p className="mt-2 font-mono text-[0.8125rem] text-muted">{project.stack.join(" · ")}</p>
    </li>
  );
}

export default function WorkPage() {
  const main = projects.filter((project) => !project.early);
  const early = projects.filter((project) => project.early);

  return (
    <div>
      <JsonLd data={workListJsonLd(projects)} />
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
      <ul className="mt-10 border-b border-border">
        {main.map((project) => (
          <WorkRow key={project.slug} project={project} heading="h2" />
        ))}
      </ul>
      {early.length > 0 ? (
        <section className="mt-14" aria-labelledby="early-heading">
          <h2 id="early-heading" className="section-title mb-2">
            Early explorations
          </h2>
          <ul className="border-b border-border">
            {early.map((project) => (
              <WorkRow key={project.slug} project={project} heading="h3" />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
