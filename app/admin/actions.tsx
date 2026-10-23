"use server";
import { compileMDX } from "next-mdx-remote/rsc";
import { requireOwner } from "@/lib/cms/server";
import { articleSchema, validateBody, CmsError } from "@/lib/cms/model";
import { mdxOptions } from "@/lib/mdx";
import { mdxComponents } from "@/components/prose";
import type { ComponentProps } from "react";

function privateImageSource(src: string) {
  return src.startsWith("/uploads/cms/")
    ? `/api/cms/media/${src
        .split("/")
        .at(-1)!
        .replace(/\.[^.]+$/, "")}`
    : src;
}
function PreviewImage({ src, alt }: ComponentProps<"img">) {
  if (typeof src !== "string") return null;
  // Private media must be fetched by the signed-in browser, never by a public optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={privateImageSource(src)} alt={alt ?? ""} loading="lazy" />;
}
function PreviewFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure>
      <PreviewImage src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
export async function previewArticle(value: unknown) {
  try {
    await requireOwner();
    const article = articleSchema.parse(value);
    validateBody(article.body);
    const { content } = await compileMDX({
      source: article.body,
      components: {
        ...mdxComponents,
        img: PreviewImage,
        Figure: PreviewFigure,
      },
      options: mdxOptions,
    });
    return { content, error: "" };
  } catch (error) {
    return {
      content: null,
      error:
        error instanceof CmsError
          ? error.message
          : "This Markdown could not be previewed. Check that code fences and diagram tags are closed.",
    };
  }
}
