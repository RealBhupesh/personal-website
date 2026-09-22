import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { WorkStory } from "@/components/work-story";
import { getProject, projects } from "@/config/work";
import { getWorkBySlug } from "@/lib/content";
import { articleMetadata, workJsonLd } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const title = "displayTitle" in project && project.displayTitle ? project.displayTitle : project.title;
  return articleMetadata({
    title,
    description: project.lede,
    path: `/work/${project.slug}`,
    image: `/og/work/${project.slug}`,
  });
}

export default async function WorkProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const work = getWorkBySlug(slug);

  return (
    <>
      {work ? <JsonLd data={workJsonLd(work)} /> : null}
      <WorkStory project={project} heading="h1" />
    </>
  );
}
