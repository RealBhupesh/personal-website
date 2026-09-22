import Image from "next/image";
import type { projects } from "@/config/work";

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

type Project = (typeof projects)[number];

function titleOf(project: Project) {
  return "displayTitle" in project && project.displayTitle ? project.displayTitle : project.title;
}

export function WorkStory({
  project,
  heading = "h2",
}: {
  project: Project;
  heading?: "h1" | "h2" | "h3";
}) {
  const Title = heading;
  const title = titleOf(project);

  return (
    <article
      id={project.slug}
      className={
        heading === "h1"
          ? "scroll-mt-28"
          : "scroll-mt-28 border-t border-border pt-10"
      }
    >
      <Title
        className={
          heading === "h1"
            ? "text-[1.75rem] font-medium tracking-[-0.03em] sm:text-[2rem]"
            : "text-[1.35rem] font-medium tracking-[-0.03em]"
        }
      >
        {title}
      </Title>
      <p className="mt-2 leading-[1.7]">{project.lede}</p>
      {"image" in project && project.image ? (
        <figure className="mt-6">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            className="h-auto w-full rounded-2xl"
          />
          <figcaption className="mt-2 text-sm leading-[1.6] text-muted">
            {project.image.caption}
          </figcaption>
        </figure>
      ) : null}
      <div className="mt-6 space-y-4">
        {project.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-[1.75]">
            {paragraph}
          </p>
        ))}
      </div>
      <dl className="mt-6 space-y-4">
        {"audience" in project && project.audience ? (
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">For</dt>
            <dd className="leading-[1.7]">{project.audience}</dd>
          </div>
        ) : null}
        {"available" in project && project.available ? (
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Available as</dt>
            <dd className="leading-[1.7]">{project.available}</dd>
          </div>
        ) : null}
        {"signal" in project && project.signal ? (
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Public signal</dt>
            <dd className="leading-[1.7]">{project.signal}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-6">
        <a href={project.href} className={textLink} rel="noreferrer" target="_blank">
          {project.cta}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </article>
  );
}
