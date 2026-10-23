import { content } from "./content";
export type Role = {
  title: string;
  org: string;
  period?: string;
  summary: string;
  points: string[];
};

export type PullRequest = {
  number: number;
  url: string;
  title: string;
};

export type Contribution = {
  project: string;
  repo: string;
  about: string;
  summary: string;
  prs: PullRequest[];
  featured: boolean;
};

export const roles = content.experience.roles;
export const skills = content.experience.skills;
export const training = content.experience.training;
export const openSourceIntro = content.openSource.intro;
export const contributions = content.openSource.repositories.map((r) => ({
  ...r,
  prs: [],
}));
