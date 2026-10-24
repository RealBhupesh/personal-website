import type { Metadata } from "next";
import { skills } from "@/config/experience";
import type { ContributionProject } from "@/lib/github-contributions";
import { profile } from "@/config/profile";
import { site } from "@/config/site";
import { titleOf, type ProjectEntry } from "@/config/work";
import type { Note, Post } from "@/lib/content";

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

const feed = {
  "application/rss+xml": "/feed.xml",
  "text/plain": "/llms-full.txt",
} as const;

const publicRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

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
  image = site.ogImage || "/opengraph-image",
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
    robots: noindex ? { index: false, follow: true } : publicRobots,
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
    authors: [{ name: site.name, url: absoluteUrl("/about") }],
    robots: publicRobots,
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
      authors: [absoluteUrl("/about")],
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
const person = { "@type": "Person", "@id": personId, name: site.name, url: absoluteUrl("/about") };

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        givenName: site.name.split(" ")[0],
        familyName: site.name.split(" ").slice(1).join(" "),
        alternateName: [site.name.split(" ")[0], new URL(site.github).pathname.slice(1)].filter(Boolean),
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
            addressLocality: profile.location.split(",")[0].trim(),
            addressRegion: profile.location.split(",")[1]?.trim(),
            addressCountry: profile.location.split(",")[2]?.trim(),
          },
        },
        hasCredential: {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "degree",
          name: profile.education,
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
    ],
  };
}

export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${absoluteUrl("/about")}#profile`,
    url: absoluteUrl("/about"),
    name: `About ${site.name}`,
    dateModified: profile.updated,
    mainEntity: person,
    isPartOf: { "@id": websiteId },
  };
}

export function writingJsonLd(posts: readonly Post[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absoluteUrl("/blog")}#writing`,
    url: absoluteUrl("/blog"),
    name: `Writing by ${site.name}`,
    author: person,
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem", position: index + 1,
        item: { "@type": "BlogPosting", headline: post.title, url: absoluteUrl(`/blog/${post.slug}`), author: person },
      })),
    },
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

export function contributionsJsonLd(contributions: ContributionProject[]) {
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
        description: item.summary || `Public pull requests by ${site.name} in ${item.repository}.`,
        contributor: person,
      },
    })),
  };
}

export function blogPostingJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
    url: absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    wordCount: post.words,
    keywords: post.tags.join(", "),
    author: person,
    publisher: person,
    inLanguage: "en",
    image: absoluteUrl(post.ogImage || `/og/blog/${post.slug}`),
    isPartOf: { "@id": `${absoluteUrl("/blog")}#writing` },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

export function noteArticleJsonLd(note: Note) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(`/notes/${note.slug}`)}#article`,
    url: absoluteUrl(`/notes/${note.slug}`),
    headline: note.title,
    description: note.description,
    wordCount: note.words,
    author: person,
    publisher: person,
    inLanguage: "en",
    image: absoluteUrl(`/og/notes/${note.slug}`),
    mainEntityOfPage: absoluteUrl(`/notes/${note.slug}`),
  };
}
