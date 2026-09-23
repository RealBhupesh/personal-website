import type { MetadataRoute } from "next";
import { getNotes, getPosts, getWork } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/about", "/work", "/blog", "/notes", "/experience", "/resume"].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: path === "/" || path === "/about" ? new Date("2026-09-23") : undefined,
    }),
  );

  const work = getWork().map((item) => ({
    url: absoluteUrl(`/work/${item.slug}`),
  }));

  const posts = getPosts().map((item) => ({
    url: absoluteUrl(`/blog/${item.slug}`),
    lastModified: new Date(`${item.updated ?? item.date}T00:00:00.000Z`),
  }));

  const notes = getNotes().map((item) => ({
    url: absoluteUrl(`/notes/${item.slug}`),
  }));

  return [...pages, ...work, ...posts, ...notes];
}
