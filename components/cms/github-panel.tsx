"use client";
import { useState } from "react";
import type { SiteEntry } from "@/lib/cms/site-service";
export function GithubPanel({
  entry,
  onAction,
  busy,
}: {
  entry: SiteEntry;
  onAction: (path: string, data: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [url, setUrl] = useState(""),
    [mode, setMode] = useState("verified"),
    [evidence, setEvidence] = useState("");
  const snapshot = entry.draft.prs ?? entry.publicPrs,
    calendar = entry.draft.calendar ?? entry.publicCalendar;
  const prs = snapshot?.prs ?? [],
    visible = prs.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        `${p.repository} ${p.title} #${p.number}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <div className="site-github">
      <p className="studio-muted">
        Sync into your private draft, check the results, then publish the
        snapshot. Automatic hourly refresh continues on the public website. PRs
        and commits are different counts.
      </p>
      <div className="studio-actions">
        {[
          ["prs", "Sync pull requests"],
          ["calendar", "Sync contribution graph"],
          ["all", "Sync all"],
        ].map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            disabled={busy}
            onClick={() => void onAction("sync", { kind })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="site-sync-status">
        {(["prs", "calendar"] as const).map((kind) => {
          const s = entry.draft.sync[kind];
          return (
            <div key={kind}>
              <h3>{kind === "prs" ? "Pull requests" : "Contribution graph"}</h3>
              <p>
                Last attempt:{" "}
                {s?.attemptedAt
                  ? new Date(s.attemptedAt).toLocaleString()
                  : "Not synced here yet"}
              </p>
              <p>
                Last success:{" "}
                {s?.successAt
                  ? new Date(s.successAt).toLocaleString()
                  : kind === "prs"
                    ? (snapshot?.updatedAt ?? "No snapshot")
                    : (calendar?.updatedAt ?? "No snapshot")}
              </p>
              {s?.error && (
                <p className="studio-error" role="alert">
                  {s.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="site-github-counts">
        <p>
          <strong>{prs.filter((p) => p.status === "merged").length}</strong>{" "}
          merged PRs · {prs.filter((p) => p.status === "open").length} open ·{" "}
          {prs.filter((p) => p.status === "closed").length} closed without merge
          · {new Set(prs.map((p) => p.repository)).size} repositories
        </p>
        <p>
          {calendar
            ? `${calendar.contributions.reduce((n, d) => n + d.count, 0).toLocaleString()} contributions in the saved calendar (${calendar.contributions[0].date} to ${calendar.contributions.at(-1)?.date})`
            : "Sync the contribution graph to review its calendar here."}
        </p>
      </div>
      {calendar && (
        <div
          className="site-calendar"
          role="img"
          aria-label={`${calendar.contributions.reduce((n, d) => n + d.count, 0)} GitHub contributions`}
          style={{
            paddingTop: `${new Date(calendar.contributions[0].date + "T00:00:00Z").getUTCDay() * 12}px`,
          }}
        >
          {calendar.contributions.map((d) => (
            <span
              key={d.date}
              data-level={d.level}
              title={`${d.date}: ${d.count} contributions`}
            />
          ))}
        </div>
      )}
      <form
        className="site-pr-import"
        onSubmit={(e) => {
          e.preventDefault();
          void onAction("pull-request", {
            credit: {
              url: url.trim().replace(/\/$/, ""),
              mode,
              ...(mode === "credited" ? { evidence: evidence.trim() } : {}),
            },
          });
        }}
      >
        <h3>Add a pull request</h3>
        <label>
          GitHub PR URL
          <input
            type="url"
            required
            placeholder="https://github.com/owner/repo/pull/123"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <label>
          Attribution
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="verified">Verify author or co-author</option>
            <option value="credited">Explicit credit with evidence</option>
          </select>
        </label>
        {mode === "credited" && (
          <label>
            Evidence link
            <input
              type="url"
              required
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </label>
        )}
        <p className="studio-muted">
          The server reads the real title, author and merge state from GitHub.
          Explicit credit is labeled separately.
        </p>
        <button type="submit" disabled={busy}>
          Verify and add to draft
        </button>
      </form>
      <div className="studio-library-tools">
        <input
          aria-label="Search GitHub contributions"
          placeholder="Search repository, title, or PR number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="PR status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="merged">Merged</option>
          <option value="open">Open</option>
          <option value="closed">Closed without merge</option>
        </select>
      </div>
      <p>{visible.length} pull requests shown</p>
      <div className="site-pr-table">
        <table>
          <thead>
            <tr>
              <th>Repository / pull request</th>
              <th>Status</th>
              <th>Dates</th>
              <th>Attribution</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.url}>
                <td>
                  <span className="studio-muted">{p.repository}</span>
                  <a href={p.url} target="_blank" rel="noreferrer">
                    #{p.number} {p.title}
                  </a>
                </td>
                <td>
                  {p.status === "closed" ? "Closed without merge" : p.status}
                </td>
                <td>
                  Created {p.createdAt.slice(0, 10)}
                  {p.mergedAt && (
                    <>
                      <br />
                      Merged {p.mergedAt.slice(0, 10)}
                    </>
                  )}
                </td>
                <td>
                  {p.attribution ?? "Authored"}
                  {p.evidence && (
                    <a href={p.evidence} target="_blank" rel="noreferrer">
                      Evidence ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && (
        <p>No matching pull requests. Sync GitHub or add a PR URL above.</p>
      )}
    </div>
  );
}
