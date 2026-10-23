import { z } from "zod";
import { CmsError, mediaSchema, digest } from "./model.ts";
import { jsonFile, type Repository, type Change } from "./repository.ts";
import {
  siteContentSchema,
  pullRequestSnapshotSchema,
  calendarSchema,
  changedFields,
  creditSchema,
  type SiteContent,
  type PullRequestSnapshot,
  type CalendarSnapshot,
  type SyncStatus,
} from "./site-model.ts";
import {
  fetchPublicPullRequests,
  type RequestJson,
} from "../github-contributions-core.ts";
import {
  githubRequest,
  verifiedPullRequest,
  fetchCalendarSnapshot,
} from "./github-admin.ts";
const publicPath = "data/site-content.json",
  draftPath = "website/content.json",
  prsPath = "data/github-contributions.json",
  calendarPath = "data/github-calendar.json";
export type SiteDraft = {
  content: SiteContent;
  base: { content: string; prs: string | null; calendar: string | null };
  updatedAt: string;
  prs?: PullRequestSnapshot;
  calendar?: CalendarSnapshot;
  sync: { prs?: SyncStatus; calendar?: SyncStatus };
  published?: { commit: string; at: string };
};
export type SiteEntry = {
  draft: SiteDraft;
  revision: string | null;
  live: SiteContent;
  changes: string[];
  publicPrs: PullRequestSnapshot | null;
  publicCalendar: CalendarSnapshot | null;
};
export class SiteService {
  readonly drafts: Repository;
  readonly website: Repository;
  constructor(drafts: Repository, website: Repository) {
    this.drafts = drafts;
    this.website = website;
  }
  async sources() {
    const [file, prs, calendar] = await Promise.all([
      this.website.read(publicPath),
      this.website.read(prsPath),
      this.website.read(calendarPath),
    ]);
    if (!file)
      throw new CmsError(
        "Website content is not installed. Deploy the dashboard update first.",
        503,
      );
    return {
      file,
      content: siteContentSchema.parse(JSON.parse(file.content)),
      prs: prs
        ? pullRequestSnapshotSchema.parse(JSON.parse(prs.content))
        : null,
      calendar:
        calendar && JSON.parse(calendar.content)
          ? calendarSchema.parse(JSON.parse(calendar.content))
          : null,
      base: {
        content: file.sha,
        prs: prs?.sha ?? null,
        calendar: calendar?.sha ?? null,
      },
    };
  }
  async get(ref?: string): Promise<SiteEntry> {
    if (ref && !/^[a-f0-9-]{20,64}$/.test(ref))
      throw new CmsError("Invalid history revision.");
    const [source, file] = await Promise.all([
      this.sources(),
      this.drafts.read(draftPath, ref),
    ]);
    if (ref && !file) throw new CmsError("Revision not found.", 404);
    const draft: SiteDraft = file
      ? JSON.parse(file.content)
      : {
          content: source.content,
          base: source.base,
          updatedAt: new Date().toISOString(),
          sync: {},
        };
    draft.content = siteContentSchema.parse(draft.content);
    const changes = changedFields(source.content, draft.content);
    if (draft.prs && jsonFile(draft.prs) !== jsonFile(source.prs))
      changes.push("github.pullRequests");
    if (
      draft.calendar &&
      jsonFile(draft.calendar) !== jsonFile(source.calendar)
    )
      changes.push("github.calendar");
    if (
      file &&
      !changes.length &&
      JSON.stringify(draft.base) !== JSON.stringify(source.base)
    )
      changes.push("publication.record");
    return {
      draft,
      revision: file?.sha ?? `public-${digest(jsonFile(source.base))}`,
      live: source.content,
      changes,
      publicPrs: source.prs,
      publicCalendar: source.calendar,
    };
  }
  async expected(revision: string | null) {
    const entry = await this.get();
    if (entry.revision !== revision)
      throw new CmsError(
        "This website draft changed in another window. Export your edits, then reload the saved version.",
        409,
      );
    return entry;
  }
  async write(draft: SiteDraft, revision: string | null, message: string) {
    await this.drafts.write(
      draftPath,
      jsonFile({ ...draft, updatedAt: new Date().toISOString() }),
      revision?.startsWith("public-") ? null : revision,
      message,
    );
    return this.get();
  }
  async save(
    value: unknown,
    revision: string | null,
    request: RequestJson = githubRequest,
  ) {
    const entry = await this.expected(revision),
      content = siteContentSchema.parse(value);
    if (content.site.url !== entry.live.site.url)
      throw new CmsError(
        "The canonical website address is managed by hosting settings.",
      );
    for (const credit of content.github.creditedPullRequests) {
      const previous = entry.draft.content.github.creditedPullRequests.find(
        (p) => p.url === credit.url,
      );
      if (
        JSON.stringify(previous) !== JSON.stringify(credit) ||
        content.github.username !== entry.draft.content.github.username ||
        JSON.stringify(content.github.creditEmails) !==
          JSON.stringify(entry.draft.content.github.creditEmails)
      )
        await verifiedPullRequest(credit, content.github, request);
    }
    // If the account changes, discard that account's pending snapshots. Do not mix identities.
    if (content.site.name !== entry.draft.content.site.name) {
      const oldName = entry.draft.content.site.name;
      content.site.title = content.site.title.replaceAll(
        oldName,
        content.site.name,
      );
      content.site.description = content.site.description.replaceAll(
        oldName,
        content.site.name,
      );
      for (const page of [
        content.pages.about,
        content.pages.work,
        content.pages.blog,
        content.pages.notes,
      ])
        page.description = page.description.replaceAll(
          oldName,
          content.site.name,
        );
    }
    const accountChanged =
      content.github.username !== entry.draft.content.github.username;
    return this.write(
      {
        ...entry.draft,
        content,
        ...(accountChanged
          ? { prs: undefined, calendar: undefined, sync: {} }
          : {}),
      },
      revision,
      "Save website content draft",
    );
  }
  async reset(revision: string | null) {
    await this.expected(revision);
    const src = await this.sources();
    return this.write(
      {
        content: src.content,
        base: src.base,
        updatedAt: new Date().toISOString(),
        sync: {},
      },
      revision,
      "Reset website draft to published content",
    );
  }
  async history() {
    return this.drafts.history(draftPath);
  }
  async restore(ref: string, revision: string | null) {
    const current = await this.expected(revision);
    const old = await this.get(ref);
    if (!old.revision) throw new CmsError("Revision not found.", 404);
    return this.write(
      {
        ...current.draft,
        content: old.draft.content,
        prs: old.draft.prs,
        calendar: old.draft.calendar,
      },
      revision,
      "Restore website revision as draft",
    );
  }
  async sync(
    kind: "prs" | "calendar" | "all",
    revision: string | null,
    request: RequestJson = githubRequest,
  ) {
    const entry = await this.expected(revision),
      draft = structuredClone(entry.draft),
      settings = draft.content.github;
    for (const target of (kind === "all" ? ["prs", "calendar"] : [kind]) as (
      "prs" | "calendar"
    )[]) {
      const attemptedAt = new Date().toISOString();
      try {
        if (target === "calendar") {
          draft.calendar = await fetchCalendarSnapshot(
            settings.username,
            request,
          );
          draft.sync.calendar = {
            attemptedAt,
            successAt: attemptedAt,
            count: draft.calendar.contributions.reduce(
              (sum, d) => sum + d.count,
              0,
            ),
          };
        } else {
          const found = await fetchPublicPullRequests(
            settings.username,
            request,
            [],
            settings.creditEmails,
          );
          const byUrl = new Map(found.map((p) => [p.url.toLowerCase(), p]));
          for (const credit of settings.creditedPullRequests) {
            const pr = await verifiedPullRequest(credit, settings, request);
            byUrl.set(pr.url.toLowerCase(), pr);
          }
          draft.prs = pullRequestSnapshotSchema.parse({
            username: settings.username,
            updatedAt: attemptedAt,
            prs: [...byUrl.values()],
          });
          draft.sync.prs = {
            attemptedAt,
            successAt: attemptedAt,
            count: draft.prs.prs.length,
          };
        }
      } catch (error) {
        draft.sync[target] = {
          ...draft.sync[target],
          attemptedAt,
          error:
            error instanceof Error
              ? error.message
              : "Sync failed. Retry later.",
        };
      }
    }
    return this.write(
      draft,
      revision,
      "Sync GitHub data into private website draft",
    );
  }
  async addPullRequest(
    value: unknown,
    revision: string | null,
    request: RequestJson = githubRequest,
  ) {
    const entry = await this.expected(revision),
      credit = creditSchema.parse(value),
      pr = await verifiedPullRequest(
        credit,
        entry.draft.content.github,
        request,
      ),
      draft = structuredClone(entry.draft);
    draft.content.github.creditedPullRequests = [
      ...draft.content.github.creditedPullRequests.filter(
        (p) => p.url.toLowerCase() !== credit.url.toLowerCase(),
      ),
      credit,
    ];
    const source = draft.prs ?? entry.publicPrs;
    const prs =
      source?.username === draft.content.github.username ? source.prs : [];
    draft.prs = {
      username: draft.content.github.username,
      updatedAt: new Date().toISOString(),
      prs: [
        ...prs.filter((p) => p.url.toLowerCase() !== pr.url.toLowerCase()),
        pr,
      ],
    };
    return this.write(
      draft,
      revision,
      `Verify PR: ${pr.repository}#${pr.number}`,
    );
  }
  async publish(revision: string | null) {
    const entry = await this.expected(revision);
    const draft = entry.draft,
      head = await this.website.head(),
      source = await this.sources();
    if (
      !entry.changes.length &&
      JSON.stringify(draft.base) === JSON.stringify(source.base)
    )
      throw new CmsError("There are no website changes to publish.");
    const changes: Change[] = [
      { path: publicPath, content: jsonFile(draft.content) },
    ];
    if (draft.prs)
      changes.push({
        path: prsPath,
        content: jsonFile(pullRequestSnapshotSchema.parse(draft.prs)),
      });
    if (draft.calendar)
      changes.push({
        path: calendarPath,
        content: jsonFile(calendarSchema.parse(draft.calendar)),
      });
    for (const change of changes) {
      const current = await this.website.read(change.path);
      const key =
        change.path === publicPath
          ? "content"
          : change.path === prsPath
            ? "prs"
            : "calendar";
      if (
        (current?.sha ?? null) !== draft.base[key] &&
        current?.content !== change.content
      )
        throw new CmsError(
          "Published content changed since this draft began. Export your draft, reset to the published version, then import the changes you want to keep.",
          409,
        );
    }
    const imagePaths = [
      draft.content.site.ogImage,
      draft.content.images.portrait.src,
      draft.content.images.artwork.src,
      ...draft.content.images.tech.map((i) => i.src),
      ...draft.content.work.projects.flatMap((p) =>
        p.image ? [p.image.src] : [],
      ),
    ];
    for (const match of new Set(
      imagePaths.filter((src) =>
        /^\/uploads\/cms\/[\w-]+\.(?:png|jpg|webp|gif)$/.test(src),
      ),
    )) {
      const filename = match.split("/").at(-1)!,
        id = filename.replace(/\.[^.]+$/, "");
      const [file, bytes] = await Promise.all([
        this.drafts.read(`media/${id}.json`),
        this.drafts.read(`media/${id}.data`),
      ]);
      if (!file || !bytes) {
        if (await this.website.read(`public${match}`)) continue;
        throw new CmsError(
          `Image ${filename} is missing from your media library.`,
        );
      }
      const media = mediaSchema.parse(JSON.parse(file.content));
      if (media.path !== `media/${filename}`)
        throw new CmsError("The uploaded image path does not match.");
      changes.push({
        path: `public${match}`,
        content: bytes.content,
        encoding: "base64",
      });
    }
    const reconciled = (
      await Promise.all(
        changes
          .filter((c) => !c.encoding)
          .map(
            async (c) =>
              (await this.website.read(c.path))?.content === c.content,
          ),
      )
    ).every(Boolean);
    const commit = reconciled
      ? head
      : await this.website.publish(
          changes,
          head,
          "Publish website content from dashboard",
        );
    const updated = await this.sources();
    if (
      jsonFile(updated.content) !== jsonFile(draft.content) ||
      (draft.prs && jsonFile(updated.prs) !== jsonFile(draft.prs)) ||
      (draft.calendar &&
        jsonFile(updated.calendar) !== jsonFile(draft.calendar))
    )
      throw new CmsError(
        `Publication ${commit} could not be verified. Retry to reconcile.`,
        502,
      );
    return this.write(
      {
        ...draft,
        base: updated.base,
        published: { commit, at: new Date().toISOString() },
      },
      revision,
      "Record website publication",
    );
  }
}
export const siteEditorSchema = () =>
  z.toJSONSchema(siteContentSchema, { unrepresentable: "any" });
