import Image from "next/image";
import Link from "next/link";
import { titleOf, type ProjectEntry } from "@/config/work";

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

const quietLink =
  "text-sm text-muted underline decoration-transparent underline-offset-[0.2em] transition-[color,text-decoration-color] duration-150 hover:text-foreground hover:decoration-foreground/40";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
      <dt className="font-mono text-[0.8125rem] text-muted">{label}</dt>
      <dd className="leading-[1.7]">{children}</dd>
    </div>
  );
}

export function WorkStory({ project, next }: { project: ProjectEntry; next: ProjectEntry }) {
  return (
    <article>
      <p>
        <Link href="/work" className={quietLink}>
          ← All work
        </Link>
      </p>
      <h1 className="mt-6 text-[1.75rem] font-medium tracking-[-0.03em] sm:text-[2rem]">
        {titleOf(project)}
      </h1>
      <p className="mt-2 leading-[1.7]">{project.lede}</p>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {"demo" in project && project.demo ? (
          <a href={project.demo} className={textLink} rel="noreferrer" target="_blank">
            Try the live demo
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        <a href={project.href} className={textLink} rel="noreferrer" target="_blank">
          Source on GitHub
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      {"image" in project && project.image ? (
        <figure className="mt-8">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            priority
            sizes="(min-width: 640px) 38rem, 100vw"
            className="h-auto w-full rounded-2xl"
          />
          <figcaption className="mt-2 text-sm leading-[1.6] text-muted">
            {project.image.caption}
          </figcaption>
        </figure>
      ) : null}
      <div className="mt-8 space-y-4">
        {project.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-[1.75]">
            {paragraph}
          </p>
        ))}
      </div>
      <dl className="mt-8 space-y-4">
        <Fact label="Built with">{project.stack.join(", ")}</Fact>
        {"audience" in project && project.audience ? <Fact label="For">{project.audience}</Fact> : null}
        {"available" in project && project.available ? (
          <Fact label="Status">{project.available}</Fact>
        ) : null}
        {"signal" in project && project.signal ? <Fact label="Traction">{project.signal}</Fact> : null}
      </dl>
      <p className="mt-8">
        <a href={project.href} className={textLink} rel="noreferrer" target="_blank">
          {project.cta}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      <nav aria-label="More work" className="mt-14 border-t border-border pt-6">
        <p className="font-mono text-[0.8125rem] text-muted">Next project</p>
        <p className="mt-1">
          <Link href={`/work/${next.slug}`} className={textLink}>
            {titleOf(next)}
          </Link>
          <span className="text-muted"> — {next.summary}</span>
        </p>
      </nav>
    </article>
  );
}
