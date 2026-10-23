"use client";
import { createContext, useContext, useId, useState } from "react";
import type { Media } from "@/lib/cms/model";
import { StudioDialog } from "./dialog";
import { MediaLibrary } from "./media-library";
import { imageUrl } from "./types";
export const SiteFieldErrors = createContext<Record<string, string>>({});
export type FieldSchema = {
  type?: string;
  properties?: Record<string, FieldSchema>;
  items?: FieldSchema;
  enum?: string[];
  required?: string[];
  default?: unknown;
  const?: unknown;
  format?: string;
  maxLength?: number;
  maximum?: number;
  minimum?: number;
  maxItems?: number;
};
const labels: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  alt: "Alternative text",
  intro: "Introduction",
  selectedIntro: "Selected work introduction",
  bio: "Short biography",
  bioLong: "Full biography",
  org: "Organization",
  lede: "Opening paragraph",
  href: "Link",
  src: "Image path",
  cta: "Source link label",
  early: "Early exploration",
  featured: "Featured",
  ogImage: "Social sharing image",
  nowUpdated: "Now update label",
  selected: "Homepage selection (project slugs)",
  available: "Availability and limits",
  signal: "Traction or result",
  repo: "Repository URL",
  prs: "Pull requests",
  x: "X profile",
  updated: "Last updated",
  url: "Canonical website address",
  creditEmails: "Public commit email identities",
  creditedPullRequests: "Imported pull requests",
  hiddenRepositories: "Repositories hidden from selections",
};
export const fieldLabel = (key: string) =>
  labels[key] ??
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
export function defaultValue(schema: FieldSchema): unknown {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.const !== undefined) return schema.const;
  if (schema.type === "object")
    return Object.fromEntries(
      Object.entries(schema.properties ?? {})
        .filter(([k]) => (schema.required ?? []).includes(k))
        .map(([k, s]) => [k, defaultValue(s)]),
    );
  if (schema.type === "array") return [];
  if (schema.type === "boolean") return false;
  if (schema.type === "number" || schema.type === "integer")
    return schema.minimum ?? 0;
  return schema.enum?.[0] ?? "";
}
export function SiteField({
  schema,
  value,
  onChange,
  label,
  path,
  content,
}: {
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  label: string;
  path: string;
  content?: unknown;
}) {
  const issues = useContext(SiteFieldErrors);
  const issue = issues[path];
  const id = useId(),
    [picking, setPicking] = useState(false);
  const key = path.split(".").at(-1) ?? path;
  if (schema.type === "object") {
    const object = (value ?? {}) as Record<string, unknown>;
    return (
      <fieldset className="site-fields">
        <legend>{label}</legend>
        {Object.entries(schema.properties ?? {}).map(([k, s]) => {
          const required = schema.required?.includes(k),
            present = object[k] !== undefined;
          if (!present && !required)
            return (
              <div className="site-optional" key={k}>
                <button
                  type="button"
                  onClick={() => onChange({ ...object, [k]: defaultValue(s) })}
                >
                  Add {fieldLabel(k).toLowerCase()}
                </button>
              </div>
            );
          return (
            <div key={k}>
              <SiteField
                schema={s}
                value={object[k]}
                onChange={(v) => {
                  const next = { ...object };
                  if (v === undefined) delete next[k];
                  else next[k] = v;
                  onChange(next);
                }}
                label={fieldLabel(k)}
                path={`${path}.${k}`}
                content={content}
              />
              {!required && (
                <button
                  className="site-remove"
                  type="button"
                  onClick={() => {
                    const next = { ...object };
                    delete next[k];
                    onChange(next);
                  }}
                >
                  Remove {fieldLabel(k).toLowerCase()}
                </button>
              )}
            </div>
          );
        })}
      </fieldset>
    );
  }
  if (schema.type === "array") {
    const list = (value ?? []) as unknown[],
      item = schema.items ?? {},
      complex = item.type === "object";
    return (
      <fieldset className="site-list">
        <legend>
          {label} <span className="studio-muted">{list.length}</span>
        </legend>
        {key === "selected" && (
          <p className="studio-muted">
            Enter project slugs in display order. Select only projects in your
            catalogue.
          </p>
        )}
        {list.length === 0 && <p className="studio-muted">No entries yet.</p>}
        {list.map((v, i) => {
          const object = v as Record<string, unknown>;
          const title = complex
            ? String(
                object.title ??
                  object.project ??
                  object.label ??
                  object.question ??
                  object.org ??
                  object.slug ??
                  `Entry ${i + 1}`,
              )
            : `${label} ${i + 1}`;
          const move = (offset: number) => {
            const next = [...list];
            [next[i], next[i + offset]] = [next[i + offset], next[i]];
            onChange(next);
          };
          const controls = (
            <div className="site-list-actions">
              <button
                type="button"
                aria-label={`Move ${title} up`}
                disabled={i === 0}
                onClick={() => move(-1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${title} down`}
                disabled={i === list.length - 1}
                onClick={() => move(1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${title}`}
                onClick={() => onChange(list.filter((_, j) => i !== j))}
              >
                Remove
              </button>
              {complex && (
                <button
                  type="button"
                  onClick={() => {
                    const copy = structuredClone(v) as Record<string, unknown>;
                    if ("slug" in copy) copy.slug = `${copy.slug}-copy`;
                    if ("id" in copy) copy.id = `${copy.id}-copy`;
                    if ("title" in copy) copy.title = `${copy.title} (copy)`;
                    onChange([
                      ...list.slice(0, i + 1),
                      copy,
                      ...list.slice(i + 1),
                    ]);
                  }}
                >
                  Duplicate
                </button>
              )}
            </div>
          );
          const field = (
            <SiteField
              schema={item}
              value={v}
              onChange={(next) =>
                onChange(list.map((old, j) => (i === j ? next : old)))
              }
              label={complex ? "Details" : `${label} ${i + 1}`}
              path={`${path}.${i}`}
              content={content}
            />
          );
          return complex ? (
            <details className="site-record" key={i}>
              <summary>{title || `Entry ${i + 1}`}</summary>
              {controls}
              {field}
            </details>
          ) : (
            <div className="site-simple-row" key={i}>
              {field}
              {controls}
            </div>
          );
        })}
        <button
          type="button"
          disabled={list.length >= (schema.maxItems ?? 1000)}
          onClick={() => onChange([...list, defaultValue(item)])}
        >
          Add entry to {label.toLowerCase()}
        </button>
      </fieldset>
    );
  }
  if (schema.type === "boolean")
    return (
      <label className="site-checkbox">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (schema.const !== undefined) return null;
  const images = ["src", "ogImage"].includes(key),
    long =
      [
        "bio",
        "bioLong",
        "intro",
        "contact",
        "paragraphs",
        "summary",
        "description",
        "lede",
        "answer",
        "seeking",
        "available",
        "detail",
        "points",
        "text",
      ].includes(key) ||
      (typeof value === "string" && value.length > 180);
  const data = content as {
    work?: {
      groups: { id: string; title: string }[];
      projects: { slug: string; title: string }[];
    };
  };
  const choices =
    key === "group"
      ? data?.work?.groups.map((g) => ({ value: g.id, label: g.title }))
      : /^work\.selected\.\d+$/.test(path)
        ? data?.work?.projects.map((p) => ({ value: p.slug, label: p.title }))
        : undefined;
  const shared = {
    id,
    "aria-invalid": Boolean(issue),
    "aria-describedby": issue ? `${id}-error` : undefined,
    value: String(value ?? ""),
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      onChange(
        schema.type === "number" || schema.type === "integer"
          ? Number(e.target.value)
          : e.target.value,
      ),
  };
  function pick(media: Media) {
    onChange(`/uploads/cms/${media.path.split("/").at(-1)}`);
    setPicking(false);
  }
  return (
    <div className="site-field">
      <label htmlFor={id}>{label}</label>
      {choices ? (
        <select {...shared}>
          <option value="">Choose…</option>
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : schema.enum ? (
        <select {...shared}>
          {schema.enum.map((v) => (
            <option key={v} value={v}>
              {fieldLabel(v)}
            </option>
          ))}
        </select>
      ) : long ? (
        <textarea
          {...shared}
          rows={key === "bioLong" ? 10 : 4}
          maxLength={schema.maxLength}
        />
      ) : (
        <input
          {...shared}
          readOnly={path === "site.url"}
          type={
            schema.type === "number" || schema.type === "integer"
              ? "number"
              : schema.format === "date"
                ? "date"
                : schema.format === "email"
                  ? "email"
                  : "text"
          }
          maxLength={schema.maxLength}
          min={schema.minimum}
          max={schema.maximum}
        />
      )}
      {issue && (
        <small id={`${id}-error`} className="studio-error" role="alert">
          {issue}
        </small>
      )}
      {key === "url" && path === "site.url" && (
        <small className="studio-muted">
          Hosting and sign-in settings control this address.
        </small>
      )}
      {images && (
        <div className="site-image-field">
          {value ? (
            // Private authenticated images use the owner media endpoint.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(String(value))} alt="Selected image preview" />
          ) : null}
          <button type="button" onClick={() => setPicking(true)}>
            Choose from media
          </button>
          <StudioDialog
            open={picking}
            onClose={() => setPicking(false)}
            title="Choose a site image"
            description="Use an uploaded image. Add alternative text in the image fields before publishing."
            wide
          >
            <MediaLibrary onCover={pick} />
          </StudioDialog>
        </div>
      )}
    </div>
  );
}
