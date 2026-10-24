"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { siteContentSchema, type SiteContent } from "@/lib/cms/site-model";
import type { SiteEntry } from "@/lib/cms/site-service";
import type { Revision } from "@/lib/cms/repository";
import {
  SiteFieldErrors,
  SiteField,
  fieldLabel,
  type FieldSchema,
} from "./site-fields";
import { recoverableSiteContent } from "./site-recovery";
import { GithubPanel } from "./github-panel";
import { StudioDialog } from "./dialog";
import { api } from "./types";
export type SiteManagerHandle = { saveBeforeLeave: () => Promise<boolean> };
type Loaded = SiteEntry & { schema?: FieldSchema };
const tabs = [
  ["profile", "Profile & About"],
  ["pages", "Pages & navigation"],
  ["experience", "Experience & education"],
  ["projects", "Projects"],
  ["now", "Now"],
  ["openSource", "Open source"],
  ["faqs", "Questions"],
  ["images", "Images"],
  ["settings", "Site settings"],
] as const;
const paths: Record<string, string[]> = {
  profile: [
    "site.name",
    "site.email",
    "site.github",
    "site.linkedin",
    "site.x",
    "site.bio",
    "site.bioLong",
    "profile",
    "pages.about",
    "images.portrait",
  ],
  pages: [
    "pages.home",
    "pages.work",
    "pages.blog",
    "pages.notes",
    "site.navigation",
  ],
  experience: ["experience", "site.education"],
  projects: ["work"],
  now: ["site.nowUpdated", "site.now"],
  openSource: ["openSource", "github.hiddenRepositories"],
  faqs: ["faqs"],
  images: ["images"],
  settings: [
    "site.title",
    "site.description",
    "site.ogImage",
    "site.googleVerification",
    "site.bingVerification",
    "site.url",
    "github.username",
    "github.creditEmails",
    "github.creditedPullRequests",
  ],
};
const recoveryKey = "website-content-recovery:v1";
function at(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], value);
}
function schemaAt(schema: FieldSchema, path: string): FieldSchema {
  return path.split(".").reduce((v, k) => v.properties?.[k] ?? {}, schema);
}
function download(value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "website-content.json";
  link.click();
  URL.revokeObjectURL(url);
}
export const SiteManager = forwardRef<
  SiteManagerHandle,
  {
    hidden: boolean;
    github: boolean;
    local: boolean;
    onSummary: (s: {
      changes: number;
      projects: number;
      sync?: string;
    }) => void;
  }
>(function SiteManager({ hidden, github, local, onSummary }, ref) {
  const [entry, setEntry] = useState<Loaded | null>(null),
    [content, setContent] = useState<SiteContent | null>(null),
    [schema, setSchema] = useState<FieldSchema | null>(null),
    [tab, setTab] = useState("profile"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [review, setReview] = useState(false),
    [history, setHistory] = useState<Revision[] | null>(null),
    [recovery, setRecovery] = useState<SiteContent | null>(null),
    [confirm, setConfirm] = useState<"reset" | null>(null),
    [deployment, setDeployment] = useState<{
      commit: string;
      state: string;
      url?: string;
    } | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null),
    current = useRef({ entry, content }),
    saving = useRef<Promise<boolean> | null>(null);
  current.current = { entry, content };
  const dirty =
    !!entry &&
    !!content &&
    JSON.stringify(entry.draft.content) !== JSON.stringify(content);
  const accept = useCallback((next: Loaded) => {
    setIssues({});
    setEntry(next);
    setContent(next.draft.content);
    if (next.schema) setSchema(next.schema);
    current.current = { entry: next, content: next.draft.content };
    try {
      localStorage.removeItem(recoveryKey);
    } catch {}
  }, []);
  const reload = useCallback(async () => {
    setError("");
    try {
      const next = await api<Loaded>("site");
      accept(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [accept]);
  useEffect(() => {
    let alive = true;
    api<Loaded>("site")
      .then((next) => {
        if (!alive) return;
        let raw: string | null = null;
        try {
          raw = localStorage.getItem(recoveryKey);
        } catch {}
        accept(next);
        if (next.draft.published)
          setDeployment({
            commit: next.draft.published.commit,
            state: local ? "success" : "pending",
          });
        try {
          if (raw) {
            localStorage.setItem(recoveryKey, raw);
            const candidate = JSON.parse(raw);
            if (
              next.schema &&
              recoverableSiteContent(candidate, next.schema) &&
              JSON.stringify(candidate) !== JSON.stringify(next.draft.content)
            )
              setRecovery(candidate);
          }
        } catch {}
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [accept, local]);
  useEffect(() => {
    if (entry)
      onSummary({
        changes: entry.changes.length + (dirty ? 1 : 0),
        projects: content?.work.projects.length ?? 0,
        sync: entry.draft.sync.prs?.successAt ?? entry.publicPrs?.updatedAt,
      });
  }, [entry, content, dirty, onSummary]);
  const save = useCallback(async (): Promise<boolean> => {
    if (saving.current) return saving.current;
    const { entry: base, content: value } = current.current;
    if (!base || !value) return false;
    if (JSON.stringify(base.draft.content) === JSON.stringify(value))
      return true;
    const task = (async () => {
      setBusy(true);
      setError("");
      try {
        const next = await api<Loaded>("site", "PUT", {
          content: value,
          revision: base.revision,
        });
        setEntry(next);
        if (JSON.stringify(current.current.content) === JSON.stringify(value)) {
          accept(next);
        }
        setNotice("Website draft saved privately.");
        return true;
      } catch (e) {
        setError((e as Error).message);
        const validation = (
          e as Error & {
            issues?: { path: (string | number)[]; message: string }[];
          }
        ).issues;
        if (validation)
          setIssues(
            Object.fromEntries(
              validation.map((i) => [i.path.join("."), i.message]),
            ),
          );
        return false;
      } finally {
        setBusy(false);
        saving.current = null;
      }
    })();
    saving.current = task;
    return task;
  }, [accept]);
  useImperativeHandle(
    ref,
    () => ({
      saveBeforeLeave: async () => {
        const c = current.current;
        if (!c.entry) return true;
        return save();
      },
    }),
    [save],
  );
  useEffect(() => {
    if (!dirty || !content) return;
    try {
      localStorage.setItem(recoveryKey, JSON.stringify(content));
    } catch {}
    const timer = setTimeout(() => void save(), 15000);
    return () => clearTimeout(timer);
  }, [dirty, content, save]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const key = (e: KeyboardEvent) => {
      if (!hidden && (e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("beforeunload", before);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("keydown", key);
    };
  }, [dirty, hidden, save]);
  useEffect(() => {
    if (
      !deployment ||
      !["pending", "queued", "in_progress"].includes(deployment.state)
    )
      return;
    let active = true;
    const timer = setInterval(() => {
      api<{ state: string; url?: string }>(`deployment/${deployment.commit}`)
        .then((v) => {
          if (active) setDeployment({ ...v, commit: deployment.commit });
        })
        .catch(() => {
          if (active) setDeployment({ ...deployment, state: "unknown" });
        });
    }, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [deployment]);
  async function action(path: string, data: Record<string, unknown> = {}) {
    if (busy || (path !== "reset" && !(await save()))) return;
    const base = current.current.entry;
    if (!base) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await api<Loaded>(`site/${path}`, "POST", {
        ...data,
        revision: base.revision,
      });
      accept(next);
      setNotice(
        path === "publish"
          ? local
            ? "Published to the local checkout only."
            : "Website content committed. Waiting for deployment."
          : path === "sync"
            ? "Sync finished. Review the data and any source errors below."
            : "Private draft updated.",
      );
      if (path === "publish") {
        setReview(false);
        const commit = next.draft.published?.commit;
        if (commit)
          setDeployment({ commit, state: local ? "success" : "pending" });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function update(path: string, value: unknown) {
    setContent((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      const keys = path.split(".");
      const parent = keys
        .slice(0, -1)
        .reduce<Record<string, unknown>>(
          (v, k) => v[k] as Record<string, unknown>,
          next as unknown as Record<string, unknown>,
        );
      parent[keys.at(-1)!] = value;
      // Removing a project also removes its homepage/gallery references. Group changes remain explicit.
      if (path === "work" || path === "work.projects") {
        const slugs = new Set(next.work.projects.map((p) => p.slug));
        next.work.selected = next.work.selected.filter((s) => slugs.has(s));
        next.images.tech = next.images.tech.filter(
          (i) => !i.href.startsWith("/work/") || slugs.has(i.href.slice(6)),
        );
      }
      return next;
    });
    setNotice("");
  }
  async function importFile(file: File) {
    try {
      if (file.size > 2 * 1024 * 1024)
        throw Error("Choose a content export smaller than 2 MB.");
      const value = JSON.parse(await file.text());
      if (value?.version !== 1 || !value.site || !value.work)
        throw Error("Choose a website-content JSON export.");
      setContent(siteContentSchema.parse(value));
      setNotice(
        "Imported into the editor. Save validates the entire draft; publishing is separate.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  const removed =
    entry && content
      ? entry.live.work.projects.filter(
          (p) => !content.work.projects.some((next) => next.slug === p.slug),
        )
      : [];
  return (
    <section
      hidden={hidden}
      className="studio-page site-manager"
      aria-label={
        github ? "GitHub activity controls" : "Website content controls"
      }
    >
      <header className="studio-page-head">
        <div>
          <h1>{github ? "GitHub activity" : "Your website, editable."}</h1>
          <p className="studio-muted">
            {busy
              ? "Working…"
              : dirty
                ? "Unsaved edits on this device"
                : entry
                  ? "Private draft saved"
                  : "Loading website content…"}
          </p>
        </div>
        <a href="/" target="_blank" rel="noreferrer">
          View current website ↗
        </a>
      </header>
      {error && (
        <div className="studio-error" role="alert">
          <p>{error}</p>
          <div className="studio-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (content) download(content);
              }}
            >
              Export edits
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    "Replace local edits with the last saved draft? Export first if you want to keep them.",
                  )
                )
                  void reload();
              }}
            >
              Reload saved draft
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p className="studio-notice" role="status">
          {notice}
        </p>
      )}
      {deployment && (
        <p role="status" className="studio-notice">
          Website deployment: {deployment.state}
          {deployment.url && (
            <>
              {" "}
              ·{" "}
              <a href={deployment.url} target="_blank" rel="noreferrer">
                Open deployment ↗
              </a>
            </>
          )}
          <br />
          <small>
            Commit {deployment.commit}. Draft saves and website deployments are
            separate.
          </small>
        </p>
      )}
      {recovery && (
        <div className="studio-notice">
          <p>Unsaved website edits were found on this device.</p>
          <button
            type="button"
            onClick={() => {
              setContent(recovery);
              setRecovery(null);
            }}
          >
            Recover edits
          </button>
          <button
            type="button"
            onClick={() => {
              setRecovery(null);
              try {
                localStorage.removeItem(recoveryKey);
              } catch {}
            }}
          >
            Discard recovery
          </button>
        </div>
      )}
      {entry && content && schema && (
        <>
          <div className="site-toolbar">
            <button
              className="studio-primary"
              type="button"
              disabled={busy || !dirty}
              onClick={() => void save()}
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy || (!dirty && !entry.changes.length)}
              onClick={async () => {
                if (await save()) setReview(true);
              }}
            >
              Review changes ({entry.changes.length + (dirty ? 1 : 0)})
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!(await save())) return;
                try {
                  setHistory(await api<Revision[]>("site/history"));
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              History
            </button>
            <button type="button" onClick={() => download(content)}>
              Export JSON
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              Import JSON
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm("reset")}
            >
              Reset draft
            </button>
            <input
              type="file"
              accept="application/json,.json"
              ref={fileInput}
              className="studio-sr-only"
              aria-label="Import website content JSON"
              onChange={(e) => {
                if (e.target.files?.[0]) void importFile(e.target.files[0]);
              }}
            />
          </div>
          <p className="site-draft-explainer">
            {entry.changes.length
              ? `${entry.changes.length} saved changes waiting for publication.`
              : "The saved content matches the public website."}{" "}
            Saving, restoring, importing and syncing keep your changes private.
          </p>
          <SiteFieldErrors.Provider value={issues}>
            <fieldset className="site-editable" disabled={busy}>
              {github ? (
                <GithubPanel entry={entry} onAction={action} busy={busy} />
              ) : (
                <>
                  <nav
                    className="site-tabs"
                    aria-label="Website content sections"
                  >
                    {tabs.map(([id, label]) => (
                      <button
                        type="button"
                        key={id}
                        aria-current={tab === id ? "page" : undefined}
                        onClick={() => setTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                  <div className="site-editor-body">
                    <h2>{tabs.find((t) => t[0] === tab)?.[1]}</h2>
                    {tab === "projects" && (
                      <p className="studio-muted">
                        Changing or removing an existing slug changes its public
                        URL. Categories and homepage selections must refer to
                        records that exist.
                      </p>
                    )}
                    {tab === "faqs" && (
                      <p className="studio-muted">
                        Use {"{mergedPrCount}"}, {"{mergedProjectCount}"},{" "}
                        {"{location}"} or {"{email}"} for live facts.
                      </p>
                    )}
                    {tab === "openSource" && (
                      <p className="studio-muted">
                        Edit the story and selection here. Factual PR counts
                        come from GitHub. Hiding a repository affects featured
                        selections; the complete contribution list is retained.
                      </p>
                    )}
                    {paths[tab].map((path) => (
                      <SiteField
                        key={path}
                        schema={schemaAt(schema, path)}
                        value={at(content, path)}
                        label={fieldLabel(path.split(".").at(-1)!)}
                        path={path}
                        onChange={(v) => update(path, v)}
                        content={content}
                      />
                    ))}
                  </div>
                </>
              )}
            </fieldset>
          </SiteFieldErrors.Provider>
          <StudioDialog
            open={review}
            onClose={() => {
              if (!busy) setReview(false);
            }}
            title="Review website changes"
            description="Only the saved website content, selected snapshots, and referenced images will be published. Article drafts publish separately."
            wide
          >
            {removed.length > 0 && (
              <p className="studio-error">
                These existing project URLs will be removed:{" "}
                {removed.map((p) => `/work/${p.slug}`).join(", ")}. Check
                incoming links before publishing.
              </p>
            )}
            <div className="site-change-review">
              {entry.changes.map((path) => (
                <details key={path}>
                  <summary>{path}</summary>
                  {path.startsWith("github.") ? (
                    <p>
                      Saved GitHub snapshot. Inspect the GitHub tab for verified
                      statuses and counts.
                    </p>
                  ) : (
                    <>
                      <h3>Current website</h3>
                      <pre>{JSON.stringify(at(entry.live, path), null, 2)}</pre>
                      <h3>Saved draft</h3>
                      <pre>
                        {JSON.stringify(at(entry.draft.content, path), null, 2)}
                      </pre>
                    </>
                  )}
                </details>
              ))}
            </div>
            <p>
              {local
                ? "This updates the local checkout only."
                : "This creates a public commit and deploys the same content to the connected website projects."}
            </p>
            <button
              type="button"
              className="studio-primary"
              disabled={busy || !entry.changes.length}
              onClick={() => void action("publish")}
            >
              {busy ? "Publishing…" : "Publish website changes"}
            </button>
          </StudioDialog>
          <StudioDialog
            open={history !== null}
            onClose={() => setHistory(null)}
            title="Website revision history"
            description="Restore an earlier version as a private draft. Publication is separate."
          >
            {history?.length ? (
              history.map((rev) => (
                <div className="site-history-row" key={rev.id}>
                  <p>
                    {rev.message}
                    <br />
                    <small>{new Date(rev.date).toLocaleString()}</small>
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await action("restore", { ref: rev.id });
                      setHistory(null);
                    }}
                  >
                    Restore as draft
                  </button>
                </div>
              ))
            ) : (
              <p>No previous saves yet.</p>
            )}
          </StudioDialog>
          <StudioDialog
            open={confirm === "reset"}
            onClose={() => setConfirm(null)}
            title="Reset website draft?"
            description="Replace private website edits and pending snapshots with the published content. Export the draft first if you want a separate backup."
          >
            <button
              type="button"
              className="studio-primary"
              disabled={busy}
              onClick={async () => {
                await action("reset");
                setConfirm(null);
              }}
            >
              Reset to current website
            </button>
          </StudioDialog>
        </>
      )}
    </section>
  );
});
