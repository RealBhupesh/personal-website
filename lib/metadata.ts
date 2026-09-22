import type { Metadata } from "next";
import { site } from "@/config/site";
import type { Note, Post, Work } from "@/lib/content";

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

const feed = {
  "application/rss+xml": "/feed.xml",
} as const;

function fullTitle(title: string, absolute: boolean) {
  return absolute ? title : `${title} · ${site.name}`;
}

function imageMeta(url: string, alt: string) {
  return [{ url, width: 1200, height: 630, alt }];
}

export function pageMetadata({
  title,
  description,
  path,
  absolute = false,
  image = "/opengraph-image",
  imageAlt,
}: {
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const resolved = fullTitle(title, absolute);
  const alt = imageAlt ?? resolved;
  const images = imageMeta(image, alt);
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path, types: feed },
    openGraph: {
      title: resolved,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: resolved,
      description,
      images,
    },
  };
}

export function articleMetadata({
  title,
  description,
  path,
  published,
  updated,
  tags,
  image,
}: {
  title: string;
  description: string;
  path: string;
  published?: string;
  updated?: string;
  tags?: string[];
  image: string;
}): Metadata {
  const resolved = fullTitle(title, false);
  const images = imageMeta(image, title);
  return {
    title,
    description,
    alternates: { canonical: path, types: feed },
    openGraph: {
      title: resolved,
      description,
      url: path,
      siteName: site.name,
      type: "article",
      locale: "en_US",
      publishedTime: published,
      modifiedTime: updated ?? published,
      tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: resolved,
      description,
      images,
    },
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    email: site.email,
    description: site.description,
    sameAs: [site.github, site.linkedin, site.x],
  };
}

export function blogPostingJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    wordCount: post.words,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

export function noteArticleJsonLd(note: Note) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: note.title,
    description: note.description,
    wordCount: note.words,
    author: { "@type": "Person", name: site.name, url: site.url },
    mainEntityOfPage: absoluteUrl(`/notes/${note.slug}`),
  };
}

export function workJsonLd(work: Work) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    description: work.description,
    ...(work.year ? { dateCreated: work.year } : {}),
    creator: { "@type": "Person", name: site.name, url: site.url },
    url: absoluteUrl(`/work/${work.slug}`),
    keywords: work.technologies.join(", "),
  };
}
