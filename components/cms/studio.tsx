"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { PostEditor } from "./post-editor";
import { MediaLibrary } from "./media-library";
import { StudioDialog } from "./dialog";
import {
  api,
  fingerprint,
  stateLabels,
  displayDate,
  type Article,
  type PostEntry,
} from "./types";
import type { Revision } from "@/lib/cms/repository";

const recoveryKey = (id: string) => `writing-recovery:${id}`;
export function Studio({
  local,
  logout,
}: {
  local: boolean;
  logout: () => Promise<void>;
}) {
  const [view, setView] = useState("overview");
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [entry, setEntry] = useState<PostEntry | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const current = useRef<{ entry: PostEntry | null; article: Article | null }>({
    entry: null,
    article: null,
  });
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recovery, setRecovery] = useState<Article | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [history, setHistory] = useState<Revision[] | null>(null);
  const [revisionPreview, setRevisionPreview] = useState<{
    id: string;
    article: Article;
  } | null>(null);
  const [deployment, setDeployment] = useState<{
    commit: string;
    state: string;
    url?: string;
  } | null>(null);
  const saving = useRef<Promise<PostEntry | null> | null>(null);
  useEffect(() => {
    current.current = { entry, article };
  }, [entry, article]);
  const dirty = Boolean(
    entry && article && fingerprint(entry.article) !== fingerprint(article),
  );
  const updatePosts = useCallback(
    (next: PostEntry) =>
      setPosts((items) => [
        next,
        ...items.filter((p) => p.article.id !== next.article.id),
      ]),
    [],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await api<PostEntry[]>("posts"));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    api<PostEntry[]>("posts")
      .then((items) => {
        if (active) setPosts(items);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function change(value: Article) {
    setArticle(value);
    current.current.article = value;
    setSaveState("Unsaved changes");
    try {
      localStorage.setItem(recoveryKey(value.id), JSON.stringify(value));
    } catch {
      setSaveState("Device recovery unavailable. Save your draft.");
    }
  }
  const save = useCallback(async (): Promise<PostEntry | null> => {
    while (saving.current) {
      const completed = await saving.current;
      if (!completed) return null;
    }
    const state = current.current;
    if (!state.article || !state.entry) return null;
    if (fingerprint(state.article) === fingerprint(state.entry.article))
      return state.entry;
    const snapshot = state.article;
    setSaveState("Saving…");
    const pending = (async () => {
      try {
        const next = await api<PostEntry>(`posts/${snapshot.id}`, "PUT", {
          article: snapshot,
          revision: state.entry!.revision,
        });
        updatePosts(next);
        if (current.current.article?.id === snapshot.id) {
          setEntry(next);
          current.current.entry = next;
          if (fingerprint(current.current.article) === fingerprint(snapshot)) {
            setArticle(next.article);
            current.current.article = next.article;
            try {
              localStorage.removeItem(recoveryKey(snapshot.id));
            } catch {}
            setSaveState(
              "Saved to " + (local ? "local workspace" : "private GitHub"),
            );
          } else setSaveState("Unsaved changes");
        }
        setError("");
        return next;
      } catch (err) {
        setSaveState(
          (err as Error & { status?: number }).status === 409
            ? "Conflict: review saved version"
            : "Not saved. Recovery copy kept.",
        );
        setError((err as Error).message);
        return null;
      } finally {
        saving.current = null;
      }
    })();
    saving.current = pending;
    return pending;
  }, [updatePosts, local]);
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => void save(), 15000);
    return () => clearTimeout(timer);
  }, [article, dirty, save]);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    const leaving = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", keys);
    window.addEventListener("beforeunload", leaving);
    return () => {
      window.removeEventListener("keydown", keys);
      window.removeEventListener("beforeunload", leaving);
    };
  }, [save, dirty]);
  useEffect(() => {
    if (
      !deployment ||
      ["success", "failure", "error", "local"].includes(deployment.state)
    )
      return;
    let alive = true;
    const timer = setInterval(() => {
      api<{ state: string; url?: string }>(`deployment/${deployment.commit}`)
        .then((status) => {
          if (alive) setDeployment({ commit: deployment.commit, ...status });
        })
        .catch((err) => {
          if (alive) setError(err.message);
        });
    }, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [deployment]);
  async function open(next: PostEntry) {
    if (dirty && !(await save())) return;
    setEntry(next);
    setArticle(next.article);
    current.current = { entry: next, article: next.article };
    setView("editor");
    setError("");
    setSaveState("Saved");
    setRecovery(null);
    try {
      const raw = localStorage.getItem(recoveryKey(next.article.id));
      if (raw) {
        const candidate = JSON.parse(raw);
        if (
          candidate.id === next.article.id &&
          typeof candidate.body === "string" &&
          fingerprint(candidate) !== fingerprint(next.article)
        )
          setRecovery(candidate);
      }
    } catch {}
  }
  async function navigate(next: string) {
    if (dirty && !(await save())) return;
    setView(next);
    setEntry(null);
    setArticle(null);
    current.current = { entry: null, article: null };
  }
  async function run<T>(task: () => Promise<T>): Promise<T | undefined> {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      return await task();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create(template: string) {
    if (dirty && !(await save())) return;
    await run(async () => {
      const next = await api<PostEntry>("posts", "POST", { template });
      updatePosts(next);
      await open(next);
    });
  }
  async function importPosts() {
    await run(async () => {
      const result = await api<{ count: number }>("import", "POST", {});
      await load();
      setNotice(
        result.count
          ? `Imported ${result.count} existing post${result.count === 1 ? "" : "s"}.`
          : "Your existing posts are already in the library.",
      );
    });
  }
  async function action(kind: "publish" | "unpublish") {
    await run(async () => {
      const saved = await save();
      if (!saved) return;
      const result = await api<PostEntry & { commit?: string }>(
        `posts/${saved.article.id}/${kind}`,
        "POST",
        { revision: saved.revision },
      );
      updatePosts(result);
      setEntry(result);
      setArticle(result.article);
      current.current = { entry: result, article: result.article };
      setConfirm(null);
      setSaveState("Saved");
      try {
        localStorage.removeItem(recoveryKey(result.article.id));
      } catch {}
      const commit = result.commit ?? result.article.published?.commit;
      if (commit) {
        const status = await api<{ state: string; url?: string }>(
          `deployment/${commit}`,
        );
        setDeployment({ commit, ...status });
      }
      setNotice(
        local
          ? `${kind === "publish" ? "Published" : "Unpublished"} in the local checkout only.`
          : kind === "publish"
            ? "Publication commit created. Waiting for the website deployment."
            : "Removal committed. The live article stays visible until deployment completes.",
      );
    });
  }
  async function duplicate() {
    if (!entry) return;
    const saved = await save();
    if (!saved) return;
    await run(async () => {
      const next = await api<PostEntry>(
        `posts/${entry.article.id}/duplicate`,
        "POST",
        {},
      );
      updatePosts(next);
      await open(next);
    });
  }
  async function archive() {
    if (!article || !entry) return;
    change({ ...article, archived: !article.archived });
    await save();
  }
  async function showHistory() {
    if (!entry) return;
    await run(async () =>
      setHistory(await api<Revision[]>(`posts/${entry.article.id}/history`)),
    );
  }
  function exportPost() {
    if (!article) return;
    const content = `---\ntitle: ${JSON.stringify(article.title)}\ndescription: ${JSON.stringify(article.description)}\ndate: ${JSON.stringify(article.date)}\ntags: ${JSON.stringify(article.tags)}\ndraft: true\n${article.ogImage ? `ogImage: ${JSON.stringify(article.ogImage)}\n` : ""}---\n\n${article.body}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${article.slug || "untitled"}.mdx`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const visible = posts
    .filter(
      (p) =>
        (filter === "all" || p.state === filter) &&
        `${p.article.title} ${p.article.description} ${p.article.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.article.title.localeCompare(b.article.title)
        : sort === "date"
          ? b.article.date.localeCompare(a.article.date)
          : b.article.updatedAt.localeCompare(a.article.updatedAt),
    );
  const counts = {
    draft: posts.filter((p) => p.state === "draft" || p.state === "changes")
      .length,
    published: posts.filter((p) => p.article.published).length,
    archived: posts.filter((p) => p.state === "archived").length,
  };
  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <a
          href="/admin"
          className="studio-brand"
          onClick={(e) => {
            e.preventDefault();
            void navigate("overview");
          }}
        >
          Bhupesh<span>Writing studio</span>
        </a>
        <nav aria-label="Studio navigation">
          {[
            ["overview", "Overview"],
            ["posts", "Posts"],
            ["media", "Media"],
            ["settings", "Settings"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "page" : undefined}
              onClick={() => void navigate(id)}
            >
              {label}
              {id === "posts" && <span>{posts.length}</span>}
            </button>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <a href="/blog" target="_blank" rel="noreferrer">
            View website ↗
          </a>
          <p>{local ? "Local workspace" : "Private GitHub workspace"}</p>
          {!local && (
            <form
              action={async () => {
                if (dirty && !(await save())) return;
                await logout();
              }}
            >
              <button>Sign out</button>
            </form>
          )}
        </div>
      </aside>
      <div className="studio-workspace">
        {local && (
          <div className="studio-local-note">
            Local development workspace. Drafts stay on this computer; Publish
            updates this checkout only.
          </div>
        )}
        {error && (
          <div className="studio-message studio-error" role="alert">
            <p>{error}</p>
            <div className="studio-actions">
              {entry && (
                <>
                  <button type="button" onClick={exportPost}>
                    Export my text
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void run(async () => {
                        const latest = await api<PostEntry>(
                          `posts/${entry.article.id}`,
                        );
                        setRecovery(article);
                        setEntry(latest);
                        setArticle(latest.article);
                        current.current = {
                          entry: latest,
                          article: latest.article,
                        };
                        setError("");
                        setSaveState("Saved version loaded");
                      })
                    }
                  >
                    Load saved version
                  </button>
                </>
              )}
              <button type="button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {notice && (
          <div className="studio-message" role="status">
            <p>{notice}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {deployment && (
          <div className="studio-message">
            <p>
              {deployment.state === "success"
                ? "Deployment succeeded. The website is up to date."
                : deployment.state === "local"
                  ? "Local publication complete. GitHub and the live website are unchanged."
                  : ["failure", "error"].includes(deployment.state)
                    ? "Deployment failed. Your draft is safe. Review the deployment log and retry after fixing the build."
                    : "Deployment is pending. Your publication commit is saved."}
            </p>
            {deployment.url && (
              <a href={deployment.url} target="_blank" rel="noreferrer">
                Deployment details ↗
              </a>
            )}
            <button
              type="button"
              aria-label="Dismiss deployment status"
              onClick={() => setDeployment(null)}
            >
              ×
            </button>
          </div>
        )}
        {view === "editor" && entry && article ? (
          <>
            {recovery && (
              <div className="studio-message">
                <p>
                  A different device recovery copy is available. Restore it to
                  compare or continue writing.
                </p>
                <div className="studio-actions">
                  <button
                    type="button"
                    onClick={() => {
                      change({
                        ...recovery,
                        published: entry.article.published,
                        slug: entry.article.published?.slug ?? recovery.slug,
                      });
                      setRecovery(null);
                    }}
                  >
                    Restore recovery copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(recoveryKey(article.id));
                      setRecovery(null);
                    }}
                  >
                    Keep saved version
                  </button>
                </div>
              </div>
            )}
            <PostEditor
              key={entry.article.id}
              entry={entry}
              article={article}
              onChange={change}
              onSave={() => void save()}
              onPublish={() => setConfirm("publish")}
              onUnpublish={() => setConfirm("unpublish")}
              onHistory={() => void showHistory()}
              onDuplicate={() => void duplicate()}
              onArchive={() => void archive()}
              onExport={exportPost}
              onBack={() => void navigate("posts")}
              busy={busy}
              saveState={saveState}
              dirty={dirty}
            />
          </>
        ) : (
          <div className="studio-page">
            <header className="studio-page-head">
              <div>
                <p className="studio-muted">Your writing workspace</p>
                <h1>
                  {view === "overview"
                    ? "Make room for the next idea."
                    : view === "posts"
                      ? "Your posts."
                      : view === "media"
                        ? "The visual library."
                        : "Workspace settings."}
                </h1>
              </div>
              {view !== "settings" && view !== "media" && (
                <Dropdown.Root>
                  <Dropdown.Trigger className="studio-primary" disabled={busy}>
                    New post <span aria-hidden="true">＋</span>
                  </Dropdown.Trigger>
                  <Dropdown.Portal>
                    <Dropdown.Content
                      className="studio-dropdown"
                      sideOffset={8}
                      align="end"
                    >
                      {[
                        ["blank", "Blank page"],
                        ["essay", "Essay"],
                        ["tutorial", "Tutorial"],
                        ["update", "Project update"],
                      ].map(([id, label]) => (
                        <Dropdown.Item
                          key={id}
                          onSelect={() => void create(id)}
                        >
                          {label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Content>
                  </Dropdown.Portal>
                </Dropdown.Root>
              )}
            </header>
            {view === "overview" && (
              <>
                <div className="studio-counts">
                  <div>
                    <strong>{loading ? "…" : counts.draft}</strong>
                    <span>Ideas in progress</span>
                  </div>
                  <div>
                    <strong>{loading ? "…" : counts.published}</strong>
                    <span>Published posts</span>
                  </div>
                  <div>
                    <strong>{loading ? "…" : counts.archived}</strong>
                    <span>In the archive</span>
                  </div>
                </div>
                <div className="studio-section-head">
                  <h2>Pick up where you left off</h2>
                  <button type="button" onClick={() => void navigate("posts")}>
                    All posts →
                  </button>
                </div>
                {loading ? (
                  <p role="status">Loading your library…</p>
                ) : posts.length ? (
                  <div className="studio-recent">
                    {posts.slice(0, 5).map((post) => (
                      <button
                        key={post.article.id}
                        type="button"
                        onClick={() => void open(post)}
                      >
                        <div>
                          <span className="studio-muted">
                            {stateLabels[post.state]}
                          </span>
                          <h3>{post.article.title || "Untitled draft"}</h3>
                          <p>
                            {post.article.description ||
                              "A thought waiting for its first sentence."}
                          </p>
                        </div>
                        <span>{displayDate(post.article.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="studio-empty">
                    <div className="studio-paper-mark" aria-hidden="true">
                      Aa
                      <span>
                        One thought.
                        <br />
                        Then the next.
                      </span>
                    </div>
                    <h2>A fresh page is a good place to start.</h2>
                    <p>
                      Create your first draft, or bring your existing website
                      articles into the studio.
                    </p>
                    <div className="studio-actions">
                      <button
                        className="studio-primary"
                        type="button"
                        onClick={() => void create("blank")}
                      >
                        Start writing
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void importPosts()}
                      >
                        Import existing posts
                      </button>
                    </div>
                  </div>
                )}
                <div className="studio-writing-note">
                  <h2>A quieter place to work.</h2>
                  <p>
                    Draft privately. Preview the real article. Publish when the
                    piece is ready. Your unfinished changes stay here until you
                    choose to share them.
                  </p>
                  <span>
                    ⌘ / Ctrl + S saves · Autosave after 15 seconds of idle time
                  </span>
                </div>
              </>
            )}
            {view === "posts" && (
              <>
                <div className="studio-library-tools">
                  <input
                    aria-label="Search posts"
                    placeholder="Search posts, ideas, or tags…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <label className="studio-sort">
                    Sort
                    <select
                      aria-label="Sort posts"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="updated">Recently edited</option>
                      <option value="date">Publication date</option>
                      <option value="title">Title</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void importPosts()}
                  >
                    Import existing posts
                  </button>
                </div>
                <div
                  className="studio-filters"
                  role="group"
                  aria-label="Filter posts"
                >
                  {[
                    ["all", "All posts"],
                    ["draft", "Drafts"],
                    ["changes", "Unpublished changes"],
                    ["published", "Published"],
                    ["archived", "Archived"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <p role="status">Loading posts…</p>
                ) : (
                  <div className="studio-post-list">
                    <div className="studio-post-list-head">
                      <span>Post</span>
                      <span>Status</span>
                      <span>Last edited</span>
                    </div>
                    {visible.map((post) => (
                      <button
                        key={post.article.id}
                        type="button"
                        className="studio-post-row"
                        onClick={() => void open(post)}
                      >
                        <div>
                          <h2>{post.article.title || "Untitled draft"}</h2>
                          <p>
                            {post.article.description || "No description yet"}
                          </p>
                          <small>{post.article.tags.join(" · ")}</small>
                        </div>
                        <span>{stateLabels[post.state]}</span>
                        <span>{displayDate(post.article.updatedAt)}</span>
                      </button>
                    ))}
                    {!visible.length && (
                      <div className="studio-empty">
                        <h2>
                          {query ? "No matching posts." : "No posts here yet."}
                        </h2>
                        <p>
                          {query
                            ? "Try another word or change the filter."
                            : "Create a draft or import your existing articles."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {view === "media" && <MediaLibrary />}
            {view === "settings" && (
              <div className="studio-settings">
                <section>
                  <h2>Connected workspace</h2>
                  <dl>
                    <div>
                      <dt>Owner</dt>
                      <dd>RealBhupesh</dd>
                    </div>
                    <div>
                      <dt>Draft storage</dt>
                      <dd>
                        {local
                          ? "Private local folder (.cms)"
                          : "Private GitHub repository"}
                      </dd>
                    </div>
                    <div>
                      <dt>Publishing destination</dt>
                      <dd>RealBhupesh/personal-website</dd>
                    </div>
                    <div>
                      <dt>Website</dt>
                      <dd>
                        <a
                          href="https://www.bhupeshcholake.in/blog"
                          target="_blank"
                          rel="noreferrer"
                        >
                          bhupeshcholake.in/blog ↗
                        </a>
                      </dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h2>Bring your writing with you</h2>
                  <p>
                    Import published articles from the website. Original URLs,
                    Markdown, code, and custom diagrams are preserved. Importing
                    does not republish them.
                  </p>
                  <button
                    className="studio-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => void importPosts()}
                  >
                    Import existing posts
                  </button>
                </section>
                <section>
                  <h2>How your writing is saved</h2>
                  <p>
                    Draft changes autosave after 15 seconds of idle time. A
                    recovery copy stays on this device until saving succeeds.
                    Revision history records earlier saves. Published posts keep
                    their live version until you publish changes.
                  </p>
                  <p>
                    Unpublishing removes the article on the next website
                    deployment. Already-published files remain in the public
                    repository&apos;s Git history.
                  </p>
                </section>
                <section>
                  <h2>Keyboard shortcuts</h2>
                  <dl>
                    <div>
                      <dt>Save draft</dt>
                      <dd>⌘ / Ctrl + S</dd>
                    </div>
                    <div>
                      <dt>Bold / italic</dt>
                      <dd>⌘ / Ctrl + B / I in visual mode</dd>
                    </div>
                    <div>
                      <dt>Close a dialog</dt>
                      <dd>Escape</dd>
                    </div>
                  </dl>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
      <StudioDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          confirm === "publish"
            ? "Ready to share this piece?"
            : "Unpublish this article?"
        }
        description={
          confirm === "publish"
            ? "Review the details below. Your draft is saved before publication."
            : "The article will leave the website after the next deployment. Its draft and revision history will stay in the studio."
        }
      >
        {article && (
          <>
            <h3>{article.title || "Untitled draft"}</h3>
            <ul className="studio-checklist">
              <li>{article.title.trim() ? "✓" : "○"} Title</li>
              <li>{article.description.trim() ? "✓" : "○"} Description</li>
              <li>
                {article.slug ? "✓" : "○"} URL: /blog/
                {article.slug || "choose-a-slug"}
              </li>
              <li>{article.body.trim() ? "✓" : "○"} Article body</li>
              <li>Publication date: {article.date}</li>
            </ul>
            <p className="studio-muted">
              {local
                ? "This updates your local checkout only. It will not change GitHub or the live website."
                : "Published articles and referenced images become public in the website repository. A deployment starts after the commit."}
            </p>
            <button
              className="studio-primary"
              type="button"
              disabled={busy}
              onClick={() => confirm && void action(confirm)}
            >
              {busy
                ? "Working…"
                : confirm === "publish"
                  ? "Publish article"
                  : "Unpublish article"}
            </button>
          </>
        )}
      </StudioDialog>
      <StudioDialog
        open={history !== null}
        onClose={() => {
          setHistory(null);
          setRevisionPreview(null);
        }}
        title="Revision history"
        description="Review an earlier save. Restoring it creates a new revision and leaves the live website unchanged."
        wide
      >
        <div className="studio-history">
          <div>
            {history?.map((rev) => (
              <button
                type="button"
                key={rev.id}
                aria-pressed={revisionPreview?.id === rev.id}
                onClick={() =>
                  void run(async () => {
                    if (!entry) return;
                    const result = await api<PostEntry>(
                      `posts/${entry.article.id}?ref=${rev.id}`,
                    );
                    setRevisionPreview({ id: rev.id, article: result.article });
                  })
                }
              >
                <strong>{rev.message}</strong>
                <span>{new Date(rev.date).toLocaleString()}</span>
              </button>
            ))}
            {history?.length === 0 && <p>No earlier saves yet.</p>}
          </div>
          {revisionPreview && (
            <section>
              <h3>{revisionPreview.article.title || "Untitled"}</h3>
              <pre>{revisionPreview.article.body}</pre>
              <button
                type="button"
                className="studio-primary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const saved = await save();
                    if (!saved) return;
                    const result = await api<PostEntry>(
                      `posts/${saved.article.id}/restore`,
                      "POST",
                      { ref: revisionPreview.id, revision: saved.revision },
                    );
                    updatePosts(result);
                    setEntry(result);
                    setArticle(result.article);
                    current.current = {
                      entry: result,
                      article: result.article,
                    };
                    setHistory(null);
                    setRevisionPreview(null);
                    setNotice("Revision restored as a new draft save.");
                  })
                }
              >
                Restore this revision
              </button>
            </section>
          )}
        </div>
      </StudioDialog>
    </div>
  );
}
