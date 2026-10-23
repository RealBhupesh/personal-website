"use client";
import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import { previewArticle } from "@/app/admin/actions";
import type { Article } from "./types";
export function Preview({ article }: { article: Article }) {
  const [rendered, setRendered] = useState<ReactNode>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    if (!copyStatus) return;
    const timer = setTimeout(() => setCopyStatus(""), 3000);
    return () => clearTimeout(timer);
  }, [copyStatus]);
  async function copyCode(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-preview-copy]");
    const code = button
      ?.closest(".article-code")
      ?.querySelector("pre code")?.textContent;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ""));
      setCopyStatus("Code copied to clipboard.");
    } catch {
      setCopyStatus(
        "Select the code to copy it. Clipboard access is unavailable.",
      );
    }
  }
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      previewArticle(article)
        .then((result) => {
          if (active) {
            setRendered(result.content);
            setError(result.error);
          }
        })
        .catch(() => {
          if (active)
            setError("Preview could not be loaded. Your draft is unchanged.");
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 650);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [article]);
  return (
    <section className="studio-preview" aria-label="Article preview">
      <div className="studio-preview-label">
        <span>Website preview</span>
        <span aria-live="polite">
          {copyStatus || (busy ? "Updating…" : "Private")}
        </span>
      </div>
      <article>
        <h1>{article.title || "Your next story"}</h1>
        <p className="studio-muted">
          {article.date} ·{" "}
          {Math.max(
            1,
            Math.ceil(article.body.trim().split(/\s+/).length / 220),
          )}{" "}
          min read
        </p>
        <p className="studio-lead">
          {article.description || "Your article description will appear here."}
        </p>
        {error ? (
          <p role="alert" className="studio-error">
            {error}
          </p>
        ) : rendered ? (
          <div className="studio-preview-body" onClick={copyCode}>
            {rendered}
          </div>
        ) : (
          <p className="studio-muted">
            {article.body.trim()
              ? "Loading preview…"
              : "Start writing to see your article take shape."}
          </p>
        )}
      </article>
    </section>
  );
}
