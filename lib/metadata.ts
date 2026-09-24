import type { Metadata } from "next";
import { contributions, skills } from "@/config/experience";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { titleOf, type ProjectEntry } from "@/config/work";
import type { Note, Post } from "@/lib/content";

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
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
}): Metadata {
  const resolved = fullTitle(title, absolute);
  const alt = imageAlt ?? resolved;
  const images = imageMeta(image, alt);
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path, types: feed },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
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

const personId = `${site.url}/#person`;
const websiteId = `${site.url}/#website`;
const person = { "@id": personId };

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        givenName: "Bhupesh",
        familyName: "Cholake",
        url: site.url,
        email: `mailto:${site.email}`,
        description: site.description,
        jobTitle: profile.headline,
        knowsAbout: [
          "Artificial intelligence",
          "AI engineering",
          "Large language models",
          "AI agents",
          "Computer vision",
          "Open-source software",
          ...skills.flatMap((group) => group.items),
        ],
        homeLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Nashik",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
        },
        hasCredential: {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "degree",
          name: "Bachelor of Engineering in Artificial Intelligence and Data Science",
        },
        hasOccupation: {
          "@type": "Occupation",
          name: "Software engineer",
          skills: skills.flatMap((group) => group.items).join(", "),
        },
        sameAs: [site.github, site.linkedin, site.x],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        url: site.url,
        description: site.description,
        publisher: person,
        inLanguage: "en",
      },
      {
        "@type": "ProfilePage",
        "@id": `${site.url}/about#profile`,
        url: absoluteUrl("/about"),
        name: `About ${site.name}`,
        dateModified: profile.updated,
        mainEntity: person,
        isPartOf: { "@id": websiteId },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function projectEntity(project: ProjectEntry) {
  return {
    "@type": "SoftwareSourceCode",
    "@id": `${absoluteUrl(`/work/${project.slug}`)}#project`,
    name: titleOf(project),
    description: project.lede,
    url: absoluteUrl(`/work/${project.slug}`),
    codeRepository: project.href,
    keywords: project.stack.join(", "),
    ...("image" in project && project.image ? { image: absoluteUrl(project.image.src) } : {}),
    ...("demo" in project && project.demo ? { targetProduct: { "@type": "SoftwareApplication", name: titleOf(project), url: project.demo } } : {}),
    author: person,
  };
}

export function workListJsonLd(items: readonly ProjectEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Work by ${site.name}`,
    itemListElement: items.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: projectEntity(project),
    })),
  };
}

export function projectJsonLd(project: ProjectEntry) {
  return { "@context": "https://schema.org", ...projectEntity(project) };
}

export function contributionsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Open-source contributions by ${site.name}`,
    itemListElement: contributions.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareSourceCode",
        name: item.project,
        codeRepository: item.repo,
        description: item.summary,
        contributor: person,
      },
    })),
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
    author: person,
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
    author: person,
    mainEntityOfPage: absoluteUrl(`/notes/${note.slug}`),
  };
}
