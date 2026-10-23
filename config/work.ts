import { content } from "./content";
export type WorkImage = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type ProjectGroup = string;

export type Project = {
  group: ProjectGroup;
  status: string;
  slug: string;
  title: string;
  displayTitle?: string;
  summary: string;
  lede: string;
  paragraphs: string[];
  audience?: string;
  available?: string;
  signal?: string;
  image?: WorkImage;
  stack: string[];
  demo?: string;
  href: string;
  cta: string;
  featured: boolean;
  early: boolean;
};

export const workIntro = content.work.intro;
export const selectedWorkIntro = content.work.selectedIntro;
export const workGroups = content.work.groups;
export const projects: Project[] = content.work.projects;
export type ProjectSlug = string;
export type ProjectEntry = Project;
export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
export const titleOf = (project: ProjectEntry) =>
  project.displayTitle || project.title;
export const featuredProjects = content.work.selected.flatMap((s) => {
  const p = getProject(s);
  return p ? [p] : [];
});
export const workProjects = workGroups.flatMap((g) =>
  projects.filter((p) => p.group === g.id),
);
export function nextProject(slug: string) {
  return workProjects[
    (workProjects.findIndex((p) => p.slug === slug) + 1) % workProjects.length
  ];
}
