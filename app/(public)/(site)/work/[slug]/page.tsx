import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { WorkStory } from "@/components/work-story";
import { getProject, nextProject, projects, titleOf } from "@/config/work";
import { articleMetadata, breadcrumbJsonLd, projectJsonLd } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return articleMetadata({
    title: titleOf(project),
    description: `${project.lede} Built by Bhupesh Cholake.`,
    path: `/work/${project.slug}`,
    image: `/og/work/${project.slug}`,
  });
}

export default async function WorkProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <JsonLd data={projectJsonLd(project)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Work", path: "/work" },
          { name: titleOf(project), path: `/work/${project.slug}` },
        ])}
      />
      <WorkStory project={project} next={nextProject(project.slug)} />
    </>
  );
}
