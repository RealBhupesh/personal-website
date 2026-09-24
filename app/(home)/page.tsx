import Link from "next/link";
import { Bio } from "@/components/bio";
import { contributions, mergedPrCount, openSourceIntro, roles } from "@/config/experience";
import { site } from "@/config/site";
import { projects, selectedWorkIntro, titleOf } from "@/config/work";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: site.title,
  description: site.description,
  path: "/",
  absolute: true,
});

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] transition-[text-decoration-color] duration-150 hover:decoration-foreground/80";

const label = "font-mono text-[0.8125rem] text-muted";

export default function HomePage() {
  const featured = projects.filter((project) => project.featured);
  const featuredContributions = contributions.filter((item) => item.featured);

  return (
    <div className="space-y-16">
      <section id="about" aria-labelledby="about-heading">
        <Bio
          short={site.bio}
          long={site.bioLong}
          portrait={{
            src: "/about/childhood-portrait.jpg",
            alt: "Bhupesh as a child, sitting on a cabinet and holding a landline phone",
            caption: "Nashik. The phone was already the interesting object in the room.",
            width: 370,
            height: 625,
          }}
          tech={[
            {
              src: "/work/asteria.png",
              alt: "Leela, the hotel guest assistant, at a reception desk",
              caption: "Asteria",
              width: 1280,
              height: 720,
              href: "/work/asteria",
            },
            {
              src: "/work/fitness.png",
              alt: "Dance Coach screen showing a hip-hop starter routine",
              caption: "Fitness coach",
              width: 841,
              height: 882,
              href: "/work/fitness-dance-diet-coach",
            },
            {
              src: "/work/physicore.png",
              alt: "Predicted airflow speed field around an airfoil",
              caption: "PhysiCore",
              width: 770,
              height: 495,
              href: "/work/physicore",
            },
          ]}
        />
      </section>

      <section aria-labelledby="experience-heading">
        <h2 id="experience-heading" className="section-title mb-4">
          Experience
        </h2>
        <ul className="border-b border-border">
          {roles.map((role) => (
            <li key={role.org} className="border-t border-border py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h3 className="font-medium">
                  {role.title}, {role.org}
                </h3>
                {"period" in role && role.period ? (
                  <p className={`shrink-0 ${label}`}>{role.period}</p>
                ) : null}
              </div>
              <p className="mt-1 leading-[1.7]">{role.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="open-source-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="open-source-heading" className="section-title">
            Open source
          </h2>
          <p className={label}>{mergedPrCount} merged PRs</p>
        </div>
        <p className="mb-6 leading-[1.75]">{openSourceIntro}</p>
        <ul className="border-b border-border">
          {featuredContributions.map((item) => (
            <li key={item.repo} className="border-t border-border py-4">
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-medium">
                  <a href={item.repo} className={textLink} rel="noreferrer" target="_blank">
                    {item.project}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </h3>
                <p className={`shrink-0 ${label}`}>
                  {item.prs.length} {item.prs.length === 1 ? "PR" : "PRs"}
                </p>
              </div>
              <p className="mt-1 leading-[1.7]">{item.summary}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href="/about#open-source" className={textLink}>
            Every contribution, with links
          </Link>
        </p>
      </section>

      <section aria-labelledby="work-heading">
        <h2 id="work-heading" className="section-title mb-4">
          Selected work
        </h2>
        <p className="mb-6 leading-[1.75]">{selectedWorkIntro}</p>
        <ul className="border-b border-border">
          {featured.map((project) => (
            <li key={project.slug} className="border-t border-border py-4">
              <h3 className="font-medium">
                <Link href={`/work/${project.slug}`} className={textLink}>
                  {titleOf(project)}
                </Link>
              </h3>
              <p className="mt-1 leading-[1.7]">{project.summary}</p>
              <p className={`mt-2 ${label}`}>{project.stack.slice(0, 4).join(" · ")}</p>
              {"demo" in project && project.demo ? (
                <p className="mt-2">
                  <a href={project.demo} className={textLink} rel="noreferrer" target="_blank">
                    Try the live demo
                    <span className="sr-only"> of {titleOf(project)} (opens in a new tab)</span>
                  </a>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <Link href="/work" className={textLink}>
            All work
          </Link>
        </p>
      </section>

      <section aria-labelledby="now-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="now-heading" className="section-title">
            Now
          </h2>
          <p className={label}>{site.nowUpdated}</p>
        </div>
        <dl className="space-y-4">
          {site.now.map((item) => (
            <div key={item.label} className="grid gap-1 sm:grid-cols-[10.5rem_1fr] sm:gap-x-6">
              <dt className={label}>{item.label}</dt>
              <dd className="leading-[1.7]">{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="section-title mb-4">
          Contact
        </h2>
        <p className="leading-[1.75]">
          If you&apos;re working on a problem that needs someone curious, resourceful, and willing
          to take ownership, I&apos;d like to hear about it. Tell me what you&apos;re trying to
          make possible.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          <a href={`mailto:${site.email}`} className={textLink}>
            Email me
          </a>
          <a href={site.github} className={textLink} rel="noreferrer" target="_blank">
            GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.linkedin} className={textLink} rel="noreferrer" target="_blank">
            LinkedIn
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>
    </div>
  );
}
