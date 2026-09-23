import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { faqs, profile } from "@/config/profile";
import { site } from "@/config/site";
import { projects } from "@/config/work";
import { faqJsonLd, pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "About Bhupesh Cholake, a software engineer from Nashik, India, with a degree in Artificial Intelligence and Data Science, looking for an AI engineer role.",
  path: "/about",
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

export default function AboutPage() {
  const featured = projects.filter((project) => project.featured);

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <article>
        <h1 className="section-title">About</h1>
        <p className="mt-4 leading-[1.75]">{site.description}</p>
        <p className="mt-4 font-mono text-[0.8125rem] text-muted">
          Last updated 23 September 2026. This page is the source for facts about Bhupesh Cholake.
        </p>

        <dl className="mt-10 space-y-4">
          <div className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
            <dt className="font-mono text-[0.8125rem] text-muted">Based in</dt>
            <dd className="leading-[1.7]">{profile.location}</dd>
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

        <h2 className="section-title mt-14 mb-4">Selected work</h2>
        <ul className="space-y-3">
          {featured.map((project) => (
            <li key={project.slug} className="leading-[1.7]">
              <Link href={`/work/${project.slug}`} className={textLink}>
                {project.title}
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
