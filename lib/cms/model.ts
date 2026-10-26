import { createHash } from "node:crypto";
import matter from "gray-matter";
import { z } from "zod";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export class CmsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const idSchema = z.string().regex(/^[a-zA-Z0-9-]{1,160}$/);
const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens",
  )
  .max(120);
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Choose a valid date",
  );
export const articleSchema = z.object({
  id: idSchema,
  kind: z.enum(["blog", "note"]).default("blog"),
  order: z.number().int().min(-10000).max(10000).default(0),
  title: z.string().max(200),
  description: z.string().max(600),
  slug: z.string().max(120),
  date: isoDate,
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  body: z.string().max(300000),
  ogImage: z.string().max(500).optional().default(""),
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  published: z
    .object({
      slug,
      kind: z.enum(["blog", "note"]).default("blog"),
      digest: z.string(),
      at: z.string(),
      commit: z.string(),
      sourceSha: z.string(),
    })
    .optional(),
});
export type Article = z.infer<typeof articleSchema>;
export type Entry = { article: Article; revision: string };
export type Media = {
  id: string;
  name: string;
  mime: string;
  alt: string;
  caption: string;
  createdAt: string;
  path: string;
};
export const mediaSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(160),
  mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  alt: z.string().max(500),
  caption: z.string().max(1000),
  createdAt: z.string().datetime(),
  path: z.string().regex(/^media\/[\w-]+\.(png|jpg|webp|gif)$/),
});
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const contentDigest = (article: Article) =>
  digest(
    JSON.stringify([
      article.title,
      article.description,
      article.slug,
      article.date,
      article.tags,
      article.ogImage,
      article.body,
      ...(article.kind === "note" ? ["note", article.order] : []),
    ]),
  );
export function articleState(article: Article) {
  if (article.archived) return "archived";
  if (!article.published) return "draft";
  return article.published.digest === contentDigest(article)
    ? "published"
    : "changes";
}
export function newArticle(id: string, template = "blank"): Article {
  const now = new Date().toISOString();
  const bodies: Record<string, string> = {
    blank: "",
    essay:
      "## The question\n\nWhat keeps bringing you back to this idea?\n\n## What I found\n\n## What changed my mind\n",
    tutorial:
      "## What you will build\n\n## Before you begin\n\n## Build it\n\n```ts\n// Start with a working example.\n```\n\n## Check your work\n",
    update:
      "## What I built\n\n## The decisions behind it\n\n## What I learned\n\n## What comes next\n",
  };
  return articleSchema.parse({
    id,
    title: "",
    description: "",
    slug: "",
    date: now.slice(0, 10),
    tags: [],
    body: bodies[template] ?? "",
    kind: template === "note" ? "note" : "blog",
    ogImage: "",
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
}
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");
}
export function validateBody(body: string) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(body);
  visit(tree, (node) => {
    if (
      ["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"].includes(node.type)
    )
      throw new CmsError(
        "JavaScript expressions and imports are not allowed in articles. Put examples inside fenced code blocks.",
      );
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      const jsx = node as unknown as {
        name: string;
        attributes: { type: string; name: string; value: unknown }[];
      };
      const allowed: Record<string, string[]> = {
        JostracaDiagram: ["kind"],
        Figure: ["src", "alt", "width", "height", "caption", "fullSizeLink"],
      };
      if (!allowed[jsx.name])
        throw new CmsError(
          `Unsupported HTML or MDX component: ${jsx.name ?? "fragment"}. Use Markdown or the diagram tools.`,
        );
      for (const attribute of jsx.attributes) {
        if (
          attribute.type !== "mdxJsxAttribute" ||
          !allowed[jsx.name].includes(attribute.name) ||
          typeof attribute.value !== "string"
        )
          throw new CmsError(
            "Diagram and image attributes must be plain text.",
          );
        if (attribute.name === "src" && !safeImage(attribute.value))
          throw new CmsError(
            "Images must use uploaded or existing site assets.",
          );
        if (attribute.name === "fullSizeLink" && !["true", "false"].includes(attribute.value))
          throw new CmsError("Full-size diagram links must be true or false.");
      }
      if (
        jsx.name === "JostracaDiagram" &&
        !["two-phases", "second-run-outcomes", "proposed-default"].includes(
          String(jsx.attributes.find((a) => a.name === "kind")?.value),
        )
      )
        throw new CmsError("Choose a supported diagram.");
    }
    const link = node as unknown as { url?: string };
    if (
      ["link", "definition"].includes(node.type) &&
      link.url &&
      !safeLink(link.url)
    )
      throw new CmsError(
        "Links must use https, http, mailto, a site path, or an anchor.",
      );
    if (node.type === "image" && link.url && !safeImage(link.url))
      throw new CmsError(
        "Upload images to your media library before inserting them.",
      );
  });
}
export function safeLink(url: string) {
  return (
    /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url) &&
    !/[\u0000-\u0020\\]/.test(url)
  );
}
export function safeImage(url: string) {
  return (
    /^\/(?!\/)[\w/.-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(url) &&
    !url.includes("..")
  );
}
export function validatePublication(article: Article) {
  articleSchema.parse(article);
  slug.parse(article.slug);
  if (!article.title.trim())
    throw new CmsError("Add a title before publishing.");
  if (!article.description.trim())
    throw new CmsError("Add a description before publishing.");
  if (!article.body.trim())
    throw new CmsError("Write the article before publishing.");
  if (article.archived)
    throw new CmsError("Restore the archived post before publishing.");
  if (article.date > new Date().toISOString().slice(0, 10))
    throw new CmsError(
      "Future dates are not scheduled publishing. Choose today or an earlier date.",
    );
  if (article.ogImage && !safeImage(article.ogImage))
    throw new CmsError("Choose a social image from the media library.");
  if (article.published && (article.slug !== article.published.slug || article.kind !== article.published.kind))
    throw new CmsError(
      "Published URLs are locked to protect existing links. Keep the published slug.",
    );
  validateBody(article.body);
}
export function serializeArticle(article: Article) {
  const fields: Record<string, unknown> = {
    title: article.title.trim(),
    description: article.description.trim(),
    date: article.date,
    tags: article.tags,
    draft: false,
  };
  if (article.kind === "note") fields.order = article.order;
  if (article.published) fields.updated = new Date().toISOString().slice(0, 10);
  if (article.ogImage) fields.ogImage = article.ogImage;
  return matter.stringify(article.body, fields);
}
export function importArticle(
  slug: string,
  source: string,
  sha: string,
  kind: "blog" | "note" = "blog",
): Article {
  const { data, content } = matter(source);
  const now = new Date().toISOString();
  const article = articleSchema.parse({
    id: `${kind === "note" ? "note-import-" : "import-"}${slug}`,
    kind,
    order: data.order ?? 0,
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: String(
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : (data.date ?? now.slice(0, 10)),
    ),
    tags: data.tags ?? [],
    body: content.trim(),
    ogImage: data.ogImage ?? "",
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
  if (data.draft !== true)
    article.published = {
      slug,
      kind,
      digest: contentDigest(article),
      at: now,
      commit: "",
      sourceSha: sha,
    };
  return article;
}
export function referencedMedia(article: Article): string[] {
  const refs = new Set<string>();
  const add = (url: string) => {
    if (/^\/uploads\/cms\/[\w-]+\.(?:png|jpg|webp|gif)$/.test(url))
      refs.add(url);
  };
  if (article.ogImage) add(article.ogImage);
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(article.body);
  const definitions = new Map<string, string>();
  visit(tree, (node) => {
    const item = node as unknown as { identifier: string; url: string };
    if (node.type === "definition") definitions.set(item.identifier, item.url);
  });
  visit(tree, (node) => {
    const item = node as unknown as {
      url: string;
      identifier: string;
      name: string;
      attributes: { name: string; value: unknown }[];
    };
    if (node.type === "image") add(item.url);
    if (node.type === "imageReference")
      add(definitions.get(item.identifier) ?? "");
    if (node.type === "mdxJsxFlowElement" && item.name === "Figure") {
      const src = item.attributes.find((a) => a.name === "src")?.value;
      if (typeof src === "string") add(src);
    }
  });
  return [...refs];
}
