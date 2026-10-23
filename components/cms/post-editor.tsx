"use client";
import { useState } from "react";
import { Writer, sourceOnly } from "./writer";
import { Preview } from "./preview";
import { StudioDialog } from "./dialog";
import { MediaLibrary } from "./media-library";
import {
  slugFromTitle,
  stateLabels,
  imageUrl,
  type PostEntry,
  type Article,
} from "./types";
import type { Media } from "@/lib/cms/model";

export function PostEditor({
  entry,
  article,
  onChange,
  onSave,
  onPublish,
  onUnpublish,
  onHistory,
  onDuplicate,
  onArchive,
  onExport,
  onBack,
  busy,
  saveState,
  dirty,
}: {
  entry: PostEntry;
  article: Article;
  onChange: (value: Article) => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onHistory: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onExport: () => void;
  onBack: () => void;
  busy: boolean;
  saveState: string;
  dirty: boolean;
}) {
  const [mode, setMode] = useState<"write" | "split" | "preview">("write");
  const [source, setSource] = useState(sourceOnly(article.body));
  const [settings, setSettings] = useState(false);
  const [media, setMedia] = useState(false);
  const [link, setLink] = useState("");
  const [applyLink, setApplyLink] = useState<((url: string) => void) | null>(
    null,
  );
  const lockedSource = sourceOnly(article.body);
  const words = article.body.trim()
    ? article.body.trim().split(/\s+/).length
    : 0;
  function update<K extends keyof Article>(key: K, value: Article[K]) {
    onChange({ ...article, [key]: value });
  }
  function insertMedia(item: Media) {
    const path = `/uploads/cms/${item.path.split("/").at(-1)}`;
    const alt = item.alt.replaceAll("[", "\\[").replaceAll("]", "\\]");
    update(
      "body",
      `${article.body}\n\n![${alt}](${path})${item.caption ? `\n\n*${item.caption.replaceAll("*", "\\*")}*` : ""}\n`,
    );
    setMedia(false);
  }
  return (
    <section
      className={`studio-editor ${settings ? "studio-editor-with-settings" : ""}`}
      aria-label="Post editor"
      aria-busy={busy}
      inert={busy}
    >
      <header className="studio-editor-top">
        <button type="button" onClick={onBack}>
          ← All posts
        </button>
        <span aria-live="polite" className="studio-save-state">
          {saveState}
        </span>
        <div className="studio-actions">
          <button type="button" onClick={onSave} disabled={busy || !dirty}>
            Save
          </button>
          <button
            className="studio-primary"
            type="button"
            onClick={onPublish}
            disabled={busy || article.archived}
          >
            {article.published ? "Publish changes" : "Publish"}
          </button>
        </div>
      </header>
      <div className="studio-editor-controls">
        <div className="studio-segment" role="group" aria-label="Editor view">
          {(["write", "split", "preview"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value === "write"
                ? "Write"
                : value === "split"
                  ? "Split view"
                  : "Preview"}
            </button>
          ))}
        </div>
        <div className="studio-actions">
          <button
            type="button"
            aria-pressed={source || lockedSource}
            disabled={lockedSource}
            onClick={() => setSource(!source)}
          >
            {source || lockedSource ? "Markdown" : "Visual editor"}
          </button>
          <button
            type="button"
            aria-pressed={settings}
            onClick={() => setSettings(!settings)}
          >
            Post settings
          </button>
        </div>
      </div>
      <div className="studio-editor-grid">
        <div className={`studio-editor-canvas studio-mode-${mode}`}>
          {mode !== "preview" && (
            <div className="studio-writing-pane">
              <div className="studio-document-meta">
                <span>
                  {dirty && article.published
                    ? "Unpublished changes"
                    : stateLabels[entry.state]}
                </span>
                <span>
                  {words.toLocaleString()} words ·{" "}
                  {Math.max(1, Math.ceil(words / 220))} min read
                </span>
              </div>
              <label className="studio-sr-only" htmlFor="post-title">
                Post title
              </label>
              <textarea
                id="post-title"
                className="studio-title-input"
                placeholder="Give your idea a title."
                rows={2}
                value={article.title}
                onChange={(e) => {
                  const title = e.target.value;
                  onChange({
                    ...article,
                    title,
                    ...(!article.published &&
                    article.slug === slugFromTitle(article.title)
                      ? { slug: slugFromTitle(title) }
                      : {}),
                  });
                }}
              />
              <label className="studio-sr-only" htmlFor="post-description">
                Post description
              </label>
              <textarea
                id="post-description"
                className="studio-description-input"
                placeholder="A short description. What will the reader take away?"
                rows={2}
                value={article.description}
                onChange={(e) => update("description", e.target.value)}
              />
              {lockedSource && (
                <p className="studio-source-note">
                  This post contains custom MDX. Markdown mode preserves every
                  diagram and code example.
                </p>
              )}
              <Writer
                value={article.body}
                onChange={(body) => update("body", body)}
                source={source || lockedSource}
                onMedia={() => setMedia(true)}
                onLink={(apply) => {
                  setLink("");
                  setApplyLink(() => apply);
                }}
              />
            </div>
          )}
          {mode !== "write" && <Preview article={article} />}
        </div>
        {settings && (
          <aside className="studio-post-settings" aria-label="Post settings">
            <h2>Post settings</h2>
            <label>
              Content type
              <select
                value={article.kind}
                disabled={Boolean(article.published)}
                onChange={(e) =>
                  update("kind", e.target.value as "blog" | "note")
                }
              >
                <option value="blog">Article</option>
                <option value="note">Note</option>
              </select>
              <small>Published type and URL stay locked.</small>
            </label>
            {article.kind === "note" && (
              <label>
                Note order
                <input
                  type="number"
                  min={-10000}
                  max={10000}
                  value={article.order}
                  onChange={(e) => update("order", Number(e.target.value))}
                />
                <small>Lower numbers appear first.</small>
              </label>
            )}
            <label>
              URL slug
              <input
                value={article.slug}
                disabled={Boolean(article.published)}
                onChange={(e) => update("slug", e.target.value)}
              />
              <small>
                /{article.kind === "note" ? "notes" : "blog"}/
                {article.slug || "your-post"}
                {article.published ? " · Published URLs are locked" : ""}
              </small>
            </label>
            <label>
              Publication date
              <input
                type="date"
                value={article.date}
                onChange={(e) => update("date", e.target.value)}
              />
              <small>Choose today or earlier. This is not a scheduler.</small>
            </label>
            <label>
              Tags
              <input
                placeholder="Software, Learning, Ideas"
                defaultValue={article.tags.join(", ")}
                key={`tags-${entry.revision}`}
                onChange={(e) =>
                  update(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  )
                }
              />
              <small>Separate tags with commas.</small>
            </label>
            <div className="studio-field">
              <label>Social image</label>
              {article.ogImage && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(article.ogImage)}
                    alt="Social preview"
                    className="studio-cover"
                  />
                </>
              )}
              <div className="studio-actions">
                <button type="button" onClick={() => setMedia(true)}>
                  {article.ogImage ? "Replace image" : "Choose image"}
                </button>
                {article.ogImage && (
                  <button type="button" onClick={() => update("ogImage", "")}>
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="studio-seo">
              <h3>Search preview</h3>
              <p className="studio-muted">
                bhupeshcholake.in › {article.kind === "note" ? "notes" : "blog"}{" "}
                › {article.slug || "your-post"}
              </p>
              <h4>{article.title || "Your article title"}</h4>
              <p>
                {article.description ||
                  "Add a description to introduce the article in search results."}
              </p>
              <small>
                {article.title.length}/60 title characters ·{" "}
                {article.description.length}/160 description characters
              </small>
            </div>
            <div className="studio-social-preview">
              <h3>Share preview</h3>
              {article.ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl(article.ogImage)}
                  alt="Selected social image"
                />
              ) : (
                <p className="studio-muted">
                  An article card is generated automatically when no image is
                  selected.
                </p>
              )}
              <small>bhupeshcholake.in</small>
              <h4>{article.title || "Your article title"}</h4>
              <p>
                {article.description ||
                  "Your description introduces the article."}
              </p>
            </div>
            <details className="studio-outline">
              <summary>Document outline</summary>
              <ul>
                {[
                  ...article.body
                    .replace(/```[\s\S]*?```/g, "")
                    .matchAll(/^#{2,3}\s+(.+)$/gm),
                ].map((m, i) => (
                  <li key={i}>{m[1]}</li>
                ))}
              </ul>
            </details>
            <div className="studio-post-tools">
              <h3>Manage this post</h3>
              <button type="button" onClick={onHistory}>
                Revision history
              </button>
              <button type="button" onClick={onDuplicate}>
                Duplicate post
              </button>
              <button type="button" onClick={onExport}>
                Export Markdown
              </button>
              {article.published ? (
                <button type="button" onClick={onUnpublish}>
                  Unpublish
                </button>
              ) : (
                <button type="button" onClick={onArchive}>
                  {article.archived ? "Restore from archive" : "Archive post"}
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
      <StudioDialog
        open={media}
        onClose={() => setMedia(false)}
        title="Find the right image"
        description="Uploaded images stay private until you publish an article that uses them."
        wide
      >
        <MediaLibrary
          onInsert={insertMedia}
          onCover={(item) => {
            update("ogImage", `/uploads/cms/${item.path.split("/").at(-1)}`);
            setMedia(false);
          }}
        />
      </StudioDialog>
      <StudioDialog
        open={Boolean(applyLink)}
        onClose={() => setApplyLink(null)}
        title="Insert a link"
        description="Use a complete web address, an email address with mailto:, or a path on your website."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(link)) return;
            applyLink?.(link);
            setApplyLink(null);
          }}
        >
          <label>
            Link address
            <input
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder="https://example.com"
              pattern="(https?://|mailto:|/|#).*"
            />
          </label>
          <button className="studio-primary">Insert link</button>
        </form>
      </StudioDialog>
    </section>
  );
}
