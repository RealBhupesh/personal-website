import { JsonLd } from "@/components/json-ld";
import { WorkStory } from "@/components/work-story";
import { projects, workIntro } from "@/config/work";
import { pageMetadata, workListJsonLd } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Work",
  description:
    "A selection of Bhupesh Cholake's work in applied AI, agent evaluation, and web development.",
  path: "/work",
});

export default function WorkPage() {
  const main = projects.filter((project) => !project.early);
  const early = projects.filter((project) => project.early);

  return (
    <div>
      <JsonLd
        data={workListJsonLd(
          projects.map((project) => ({
            title: "displayTitle" in project && project.displayTitle ? project.displayTitle : project.title,
            description: project.summary,
            slug: project.slug,
            github: project.href,
          })),
        )}
      />
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
      <div className="mt-16 space-y-16">
        {main.map((project) => (
          <WorkStory key={project.slug} project={project} />
        ))}
      </div>
      {early.length > 0 ? (
        <section className="mt-16" aria-labelledby="early-heading">
          <h2 id="early-heading" className="section-title">
            Early explorations
          </h2>
          <div className="mt-10 space-y-16">
            {early.map((project) => (
              <WorkStory key={project.slug} project={project} heading="h3" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
