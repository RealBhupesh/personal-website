import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/config/site";
import {
  formatMonthYear,
  getNoteBySlug,
  getPostBySlug,
  getWorkBySlug,
} from "@/lib/content";
import { createOgImage } from "@/lib/og";

type Props = { params: Promise<{ path?: string[] }> };

function fileResponse(bytes: Buffer, file: string) {
  const type = file.endsWith(".jpg") || file.endsWith(".jpeg")
    ? "image/jpeg"
    : file.endsWith(".webp")
      ? "image/webp"
      : "image/png";
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": type },
  });
}

export async function GET(_request: Request, { params }: Props) {
  const { path = [] } = await params;
  const [kind, slug] = path;

  if (kind === "blog" && slug) {
    const post = getPostBySlug(slug);
    if (post?.ogImage?.startsWith("/")) {
      const bytes = await readFile(
        join(process.cwd(), "public", post.ogImage.replace(/^\//, "")),
      );
      return fileResponse(bytes, post.ogImage);
    }
    return createOgImage({
      title: post?.title ?? "Writing",
      label: post ? formatMonthYear(post.date) : undefined,
    });
  }

  if (kind === "notes" && slug) {
    const note = getNoteBySlug(slug);
    return createOgImage({
      title: note?.title ?? "Notes",
      label: "Notes",
    });
  }

  if (kind === "work" && slug) {
    const project = getWorkBySlug(slug);
    return createOgImage({
      title: project?.title ?? "Work",
      label: project?.year,
    });
  }

  return createOgImage({
    title: site.name,
    label: "AI engineer and builder",
  });
}
