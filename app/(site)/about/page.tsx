import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { contributions, mergedPrCount, roles, skills, training } from "@/config/experience";
import { faqs, profile } from "@/config/profile";
import { site } from "@/config/site";
import { projects, titleOf } from "@/config/work";
import { breadcrumbJsonLd, contributionsJsonLd, faqJsonLd, pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Facts about Bhupesh Cholake: a software engineer in Nashik, India, building AI applications, with merged open-source work and a degree in AI and Data Science.",
  path: "/about",
});

const label = "font-mono text-[0.8125rem] text-muted";

const updated = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${profile.updated}T00:00:00.000Z`));

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function AboutPage() {
  const featured = projects.filter((project) => project.featured);
  const [recentRole] = roles;

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />
      <JsonLd data={contributionsJsonLd()} />
      <article>
        <h1 className="section-title">About</h1>
        <p className="mt-4 leading-[1.75]">{site.description}</p>
        <p className="mt-4 font-mono text-[0.8125rem] text-muted">
          Last updated {updated}. This page is the source for facts about Bhupesh Cholake.
        </p>

        <dl className="mt-10 space-y-4">
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Based in</dt>
            <dd className="leading-[1.7]">{profile.location}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Recent role</dt>
            <dd className="leading-[1.7]">
              Founding engineer intern, {recentRole.org}, {recentRole.period}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Open source</dt>
            <dd className="leading-[1.7]">
              {mergedPrCount} merged pull requests across{" "}
              {contributions.map((item) => item.project).join(", ")}.{" "}
              <Link href="#open-source" className={textLink}>
                See each one
              </Link>
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Education</dt>
            <dd className="leading-[1.7]">{profile.education}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Looking for</dt>
            <dd className="leading-[1.7]">
              An AI engineer role: work that asks him to think deeply, learn quickly, and take
              responsibility for bringing something into the world.
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Email</dt>
            <dd>
              <a href={`mailto:${site.email}`} className={textLink}>
                {site.email}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">GitHub</dt>
            <dd>
              <a href={site.github} className={textLink} rel="me noreferrer" target="_blank">
                github.com/RealBhupesh
              </a>
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">LinkedIn</dt>
            <dd>
              <a href={site.linkedin} className={textLink} rel="me noreferrer" target="_blank">
                linkedin.com/in/thebhupesh
              </a>
            </dd>
          </div>
        </dl>

        <section className="mt-14" aria-labelledby="experience-heading">
          <h2 id="experience-heading" className="section-title mb-6">
            Experience
          </h2>
          <ol className="space-y-10">
            {roles.map((role) => (
              <li key={role.org}>
                <h3 className="font-medium">
                  {role.title}, {role.org}
                </h3>
                {"period" in role && role.period ? <p className={`mt-1 ${label}`}>{role.period}</p> : null}
                <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted">
                  {role.points.map((point) => (
                    <li key={point} className="leading-[1.7]">
                      {point}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section id="open-source" className="mt-14 scroll-mt-28" aria-labelledby="open-source-heading">
          <h2 id="open-source-heading" className="section-title mb-2">
            Open source
          </h2>
          <p className={`mb-6 ${label}`}>{mergedPrCount} merged pull requests</p>
          <ol className="space-y-8">
            {contributions.map((item) => (
              <li key={item.repo}>
                <h3 className="font-medium">
                  <a href={item.repo} className={textLink} rel="noreferrer" target="_blank">
                    {item.project}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </h3>
                <p className="mt-1 text-sm leading-[1.6] text-muted">{item.about}</p>
                <p className="mt-2 leading-[1.7]">{item.summary}</p>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.8125rem]">
                  {item.prs.map((pr) => (
                    <a
                      key={pr.number}
                      href={pr.url}
                      title={pr.title}
                      className={textLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      #{pr.number}
                      <span className="sr-only">: {pr.title} (opens in a new tab)</span>
                    </a>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="section-title mb-6">
            Skills
          </h2>
          <dl className="space-y-4">
            {skills.map((group) => (
              <div key={group.label} className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
                <dt className={label}>{group.label}</dt>
                <dd className="leading-[1.7]">{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14" aria-labelledby="education-heading">
          <h2 id="education-heading" className="section-title mb-6">
            Education
          </h2>
          {site.education.map((item) => (
            <div key={item.title}>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 leading-[1.75]">{item.detail}</p>
            </div>
          ))}
          <ul className="mt-6 list-disc space-y-2 pl-5 marker:text-muted">
            {training.map((item) => (
              <li key={item} className="leading-[1.7]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <h2 className="section-title mt-14 mb-4">Selected work</h2>
        <ul className="space-y-3">
          {featured.map((project) => (
            <li key={project.slug} className="leading-[1.7]">
              <Link href={`/work/${project.slug}`} className={textLink}>
                {titleOf(project)}
              </Link>
              <span className="text-muted"> — {project.summary}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href="/work" className={textLink}>
            All work
          </Link>
        </p>

        <h2 className="section-title mt-14 mb-4">Questions</h2>
        <div className="space-y-8">
          {faqs.map((item) => (
            <section key={item.question}>
              <h3 className="font-medium">{item.question}</h3>
              <p className="mt-2 leading-[1.75]">{item.answer}</p>
            </section>
          ))}
        </div>
      </article>
    </>
  );
}
