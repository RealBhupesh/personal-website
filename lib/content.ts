import { cache } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { projects } from "@/config/work";

const contentRoot = join(process.cwd(), "content");

export type Work = {
  slug: string;
  title: string;
  description: string;
  year?: string;
  role?: string;
  technologies: string[];
  github?: string;
  live?: string;
  draft: boolean;
  order: number;
  body: string;
};

export type Note = {
  slug: string;
  title: string;
  description: string;
  draft: boolean;
  order: number;
  body: string;
  readingTime: string;
  words: number;
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  draft: boolean;
  ogImage?: string;
  body: string;
  readingTime: string;
  words: number;
};

type Fields = Record<string, unknown>;

function isDraft(data: Fields) {
  return data.draft === true;
}

function visible(draft: boolean) {
  return !draft || process.env.NODE_ENV !== "production";
}

function readMdx(directory: string) {
  const dir = join(contentRoot, directory);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = readFileSync(join(dir, file), "utf8");
      const { data, content } = matter(raw);
      return { slug, data: data as Fields, body: content.trim(), file };
    });
}

function asString(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function requiredString(data: Fields, key: string, file: string) {
  const value = asString(data[key]);
  if (!value) throw new Error(`Missing "${key}" in ${file}`);
  return value;
}

function optionalString(data: Fields, key: string) {
  return asString(data[key]);
}

function stringList(data: Fields, key: string) {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function optionalOrder(data: Fields) {
  return typeof data.order === "number" ? data.order : 0;
}

export function formatMonthYear(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)));
}

export const getWork = cache((): Work[] => {
  return projects.map((project, order) => ({
    slug: project.slug,
    title: project.title,
    description: project.summary,
    technologies: [],
    github: project.href,
    draft: false,
    order,
    body: project.paragraphs.join("\n\n"),
  }));
});

export const getNotes = cache((): Note[] => {
  return readMdx("notes")
    .map(({ slug, data, body, file }) => {
      const stats = readingTime(body);
      return {
        slug,
        title: requiredString(data, "title", file),
        description: requiredString(data, "description", file),
        draft: isDraft(data),
        order: optionalOrder(data),
        body,
        readingTime: stats.text,
        words: stats.words,
      };
    })
    .filter((item) => visible(item.draft))
    .sort((a, b) => a.order - b.order);
});

export const getPosts = cache((): Post[] => {
  return readMdx("blog")
    .map(({ slug, data, body, file }) => {
      const stats = readingTime(body);
      return {
        slug,
        title: requiredString(data, "title", file),
        description: requiredString(data, "description", file),
        date: requiredString(data, "date", file),
        updated: optionalString(data, "updated"),
        tags: stringList(data, "tags"),
        draft: isDraft(data),
        ogImage: optionalString(data, "ogImage"),
        body,
        readingTime: stats.text,
        words: stats.words,
      };
    })
    .filter((item) => visible(item.draft))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
});

export function getWorkBySlug(slug: string) {
  return getWork().find((item) => item.slug === slug);
}

export function getNoteBySlug(slug: string) {
  return getNotes().find((item) => item.slug === slug);
}

export function getPostBySlug(slug: string) {
  return getPosts().find((item) => item.slug === slug);
}
