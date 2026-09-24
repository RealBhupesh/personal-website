import type { MetadataRoute } from "next";
import { profile } from "@/config/profile";
import { projects } from "@/config/work";
import { getNotes, getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(`${profile.updated}T00:00:00.000Z`);
  const posts = getPosts();
  const notes = getNotes();

  const pages = [
    { path: "/", priority: 1 },
    { path: "/about", priority: 0.9 },
    { path: "/work", priority: 0.8 },
    ...(posts.length > 0 ? [{ path: "/blog", priority: 0.6 }] : []),
    ...(notes.length > 0 ? [{ path: "/notes", priority: 0.5 }] : []),
  ].map(({ path, priority }) => ({ url: absoluteUrl(path), lastModified: updated, priority }));

  const work = projects.map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    lastModified: updated,
    priority: project.featured ? 0.7 : 0.5,
  }));

  const postEntries = posts.map((item) => ({
    url: absoluteUrl(`/blog/${item.slug}`),
    lastModified: new Date(`${item.updated ?? item.date}T00:00:00.000Z`),
    priority: 0.6,
  }));

  const noteEntries = notes.map((item) => ({
    url: absoluteUrl(`/notes/${item.slug}`),
    priority: 0.4,
  }));

  return [...pages, ...work, ...postEntries, ...noteEntries];
}
