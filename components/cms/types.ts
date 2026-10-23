import type { Article, Entry } from "@/lib/cms/model";
export type PostEntry = Entry & {
  state: "draft" | "published" | "changes" | "archived";
};
export type { Article };
export function fingerprint(a: Article) {
  return JSON.stringify([
    a.title,
    a.description,
    a.slug,
    a.date,
    a.tags,
    a.body,
    a.ogImage,
    a.archived,
    a.kind,
    a.order,
  ]);
}
export function slugFromTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");
}
export const stateLabels = {
  draft: "Draft",
  published: "Published",
  changes: "Unpublished changes",
  archived: "Archived",
};
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const response = await fetch(`/api/cms/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    ...(data
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error ?? "Request failed.") as Error & {
      status?: number;
      issues?: { path: (string | number)[]; message: string }[];
    };
    error.status = response.status;
    error.issues = result.issues;
    throw error;
  }
  return result;
}
export function imageUrl(path: string) {
  return path.startsWith("/uploads/cms/")
    ? `/api/cms/media/${path
        .split("/")
        .at(-1)!
        .replace(/\.[^.]+$/, "")}`
    : path;
}
export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
