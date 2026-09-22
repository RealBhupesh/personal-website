import { site } from "@/config/site";
import { Timeline } from "@/components/timeline";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Experience",
  description: "Experience and education of Bhupesh Cholake.",
  path: "/experience",
});

export default function ExperiencePage() {
  return (
    <>
      <h1 className="section-title mb-10">Experience</h1>
      {site.experience.length > 0 ? (
        <section aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="section-title mb-5">
            Roles
          </h2>
          <Timeline items={site.experience} />
        </section>
      ) : null}
      <section className={site.experience.length > 0 ? "mt-14" : undefined} aria-labelledby="education-heading">
        <h2 id="education-heading" className="section-title mb-5">
          Education
        </h2>
        <Timeline items={site.education} />
      </section>
    </>
  );
}
