"use client";

import { useId, useState } from "react";
import type { ContributionProject } from "@/lib/github-contributions";
import { projectCounts } from "@/lib/github-contributions-core";

const textLink =
  "underline decoration-foreground/25 underline-offset-[0.2em] hover:decoration-foreground focus-visible:decoration-foreground";

export function ContributionArchive({ projects }: { projects: ContributionProject[] }) {
  const searchId = useId();
  const resultsId = useId();
  const [search, setSearch] = useState("");
  const [mergedOnly, setMergedOnly] = useState(false);
  const query = search.trim().toLowerCase();
  const visible = projects
    .filter((item) =>
      item.repository.toLowerCase().includes(query) || item.project.toLowerCase().includes(query),
    )
    .map((item) => ({
      item,
      prs: mergedOnly ? item.prs.filter((pr) => pr.status === "merged") : item.prs,
    }))
    .filter(({ prs }) => prs.length > 0);
  const prCount = visible.reduce((count, { prs }) => count + prs.length, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="w-full max-w-sm">
          <label htmlFor={searchId} className="mb-1 block text-sm font-medium">
            Search repositories
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-controls={resultsId}
            placeholder="e.g. Flatbush"
            className="min-h-11 w-full rounded-sm border border-muted bg-background px-3 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mergedOnly}
            onChange={(event) => setMergedOnly(event.target.checked)}
            aria-controls={resultsId}
            className="size-4 accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          Merged only
        </label>
      </div>
      <p className="text-sm text-muted not-empty:mb-6" role="status">
        {prCount === 0
          ? "No pull requests match these filters."
          : (query || mergedOnly) && `Showing ${prCount} pull request${prCount === 1 ? "" : "s"} across ${visible.length} repositor${visible.length === 1 ? "y" : "ies"}.`}
      </p>
      <ol id={resultsId} className="space-y-8">
        {visible.map(({ item, prs }) => (
          <li key={item.repo}>
            <h3 className="font-medium">
              <a href={item.repo} className={textLink} rel="noreferrer" target="_blank">
                {item.project}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </h3>
            {item.about && <p className="mt-1 text-sm leading-[1.6] text-muted">{item.about}</p>}
            {item.summary && <p className="mt-2 leading-[1.7]">{item.summary}</p>}
            <p className="mt-2 text-sm text-muted">{projectCounts(mergedOnly ? { mergedCount: prs.length, openCount: 0, closedCount: 0 } : item)}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {prs.map((pr) => (
                <li key={pr.url} className="leading-relaxed">
                  <a
                    href={pr.url}
                    title={pr.title}
                    className={textLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    #{pr.number}: {pr.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <span className="text-muted"> ({pr.status === "closed" ? "closed without merge" : pr.status})</span>
                  {pr.attribution && pr.evidence && (
                    <span className="text-muted"> · <a href={pr.evidence} className={textLink} rel="noreferrer" target="_blank">{pr.attribution === "co-authored" ? "Co-authored contribution" : "Credited original patch"}<span className="sr-only"> (opens in a new tab)</span></a></span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
