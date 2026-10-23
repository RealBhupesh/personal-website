"use client";
import { useEffect, useState, type ReactNode } from "react";
import { previewArticle } from "@/app/admin/actions";
import type { Article } from "./types";
export function Preview({ article }: { article: Article }) {
  const [rendered, setRendered] = useState<ReactNode>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
        <span aria-live="polite">{busy ? "Updating…" : "Private"}</span>
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
          <div className="studio-preview-body">{rendered}</div>
        ) : (
          <p className="studio-muted">
            Start writing to see your article take shape.
          </p>
        )}
      </article>
    </section>
  );
}
