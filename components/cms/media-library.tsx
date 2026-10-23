"use client";
import { useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/cms/model";
import { api } from "./types";
export function MediaLibrary({
  onInsert,
  onCover,
}: {
  onInsert?: (media: Media) => void;
  onCover?: (media: Media) => void;
}) {
  const [items, setItems] = useState<Media[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function load() {
    try {
      setItems(await api<Media[]>("media"));
    } catch (err) {
      setError((err as Error).message);
    }
  }
  useEffect(() => {
    let alive = true;
    api<Media[]>("media")
      .then((v) => {
        if (alive) setItems(v);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function upload(file: File) {
    setError("");
    if (file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG, JPEG, WebP, or GIF smaller than 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(new Blob([buffer]));
      });
      const media = await api<Media>("media", "POST", {
        name: file.name,
        mime: file.type,
        base64,
        alt: "",
        caption: "",
      });
      setItems((current) => [media, ...current]);
      setEditing(media);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function saveDetails() {
    if (!editing) return;
    setBusy(true);
    try {
      await api(`media/${editing.id}`, "PUT", {
        alt: editing.alt,
        caption: editing.caption,
      });
      await load();
      setEditing(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="studio-media">
      <div className="studio-section-head">
        <div>
          <h2>Media library</h2>
          <p className="studio-muted">
            Private until referenced by a published article or website content. Images up to 2 MB.
          </p>
        </div>
        <button
          className="studio-primary"
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? "Working…" : "Upload image"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="studio-sr-only"
          aria-label="Upload image"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </div>
      <input
        className="studio-search"
        aria-label="Search media"
        placeholder="Search by name or description…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && (
        <p className="studio-error" role="alert">
          {error}
        </p>
      )}
      {editing && (
        <form
          className="studio-media-details"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDetails();
          }}
        >
          <h3>Describe {editing.name}</h3>
          <label>
            Alt text
            <input
              value={editing.alt}
              onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
              placeholder="What should a reader know about this image?"
            />
          </label>
          <label>
            Caption
            <input
              value={editing.caption}
              onChange={(e) =>
                setEditing({ ...editing, caption: e.target.value })
              }
            />
          </label>
          <div className="studio-actions">
            <button className="studio-primary" disabled={busy}>
              Save descriptions
            </button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="studio-media-grid">
        {items
          .filter((i) =>
            `${i.name} ${i.alt}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => (
            <figure key={item.id}>
              {/* Private, authenticated images cannot go through the public optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/cms/media/${item.id}`}
                alt={item.alt || item.name}
                loading="lazy"
              />
              <figcaption>
                <strong>{item.name}</strong>
                <p>{item.alt || "Add alt text before inserting"}</p>
                <div className="studio-actions">
                  <button type="button" onClick={() => setEditing(item)}>
                    Describe
                  </button>
                  {onInsert && (
                    <button
                      type="button"
                      disabled={!item.alt.trim()}
                      onClick={() => onInsert(item)}
                    >
                      Insert
                    </button>
                  )}
                  {onCover && (
                    <button type="button" onClick={() => onCover(item)}>
                      Use as cover
                    </button>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
      </div>
      {!items.length && !busy && (
        <div className="studio-empty">
          <h3>Room for the visual part.</h3>
          <p>
            Upload a screenshot, diagram, or photograph. Add a description, then
            place it in your article.
          </p>
        </div>
      )}
    </div>
  );
}
