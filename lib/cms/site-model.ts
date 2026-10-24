import { z } from "zod";

const text = z.string().max(12000);
const short = z.string().max(600);
const name = z.string().trim().min(1).max(200);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);
const link = z
  .string()
  .max(800)
  .refine(
    (v) =>
      /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(v) &&
      !/[\u0000-\u0020\\]/.test(v),
    "Use a valid web address or site path",
  );
const web = z
  .url()
  .max(800)
  .refine((v) => /^https:\/\//.test(v), "Use an HTTPS address");
const imagePath = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[\w/.-]+\.(png|jpe?g|webp|gif|svg)$/i)
  .refine((v) => !v.includes(".."), "Choose an existing site image");
const strings = z.array(short).max(100);
const image = z.strictObject({
  src: imagePath,
  alt: name.max(500),
  caption: short,
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
});
const role = z.strictObject({
  title: name,
  org: name,
  period: short.optional(),
  summary: text,
  points: z.array(text).max(50),
});
const project = z.strictObject({
  group: slug,
  status: short,
  slug,
  title: name,
  displayTitle: short.optional(),
  summary: text,
  lede: text,
  paragraphs: z.array(text).max(100),
  audience: text.optional(),
  available: text.optional(),
  signal: short.optional(),
  image: image.optional(),
  stack: strings,
  demo: web.optional(),
  href: web,
  cta: name,
  featured: z.boolean(),
  early: z.boolean(),
});
const searchTitle = z.string().trim().max(200).default("");
const verification = z.string().trim().max(200).default("");
const page = { title: name, seoTitle: searchTitle, description: short };
const prUrl = z
  .string()
  .regex(
    /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/,
  );
export const creditSchema = z
  .strictObject({
    url: prUrl,
    mode: z.enum(["verified", "credited"]),
    evidence: web.optional(),
  })
  .refine(
    (v) => v.mode !== "credited" || !!v.evidence,
    "Credited work needs an evidence link",
  );
export const siteContentSchema = z
  .strictObject({
    version: z.literal(1),
    site: z.strictObject({
      name,
      title: short.min(1),
      description: short,
      googleVerification: verification,
      bingVerification: verification,
      url: web,
      email: z.email(),
      github: web,
      linkedin: web,
      x: web,
      bio: text,
      bioLong: text,
      nowUpdated: short,
      now: z.array(z.strictObject({ label: name, text })).max(50),
      navigation: z.array(z.strictObject({ href: link, label: name })).max(15),
      education: z.array(z.strictObject({ title: name, detail: text })).max(30),
      ogImage: imagePath.or(z.literal("")).default(""),
    }),
    profile: z.strictObject({
      updated: z.iso.date(),
      location: short,
      education: short,
      seeking: text,
      headline: short,
    }),
    experience: z.strictObject({
      roles: z.array(role).max(50),
      skills: z.array(z.strictObject({ label: name, items: strings })).max(50),
      training: strings,
    }),
    work: z.strictObject({
      intro: z.array(text).max(15),
      selectedIntro: text,
      groups: z
        .array(z.strictObject({ id: slug, title: name, description: text }))
        .max(30),
      projects: z.array(project).max(200),
      selected: z.array(slug).max(30),
    }),
    openSource: z.strictObject({
      intro: text,
      repositories: z
        .array(
          z.strictObject({
            project: name,
            repo: web,
            about: text,
            summary: text,
            featured: z.boolean(),
            hidden: z.boolean().default(false),
          }),
        )
        .max(300),
    }),
    github: z.strictObject({
      username: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/),
      creditEmails: z.array(z.email()).max(30),
      creditedPullRequests: z.array(creditSchema).max(200),
      hiddenRepositories: z
        .array(z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/))
        .max(200),
    }),
    pages: z.strictObject({
      home: z.strictObject({
        contact: text,
        visibility: z.strictObject({
          about: z.boolean(),
          experience: z.boolean(),
          openSource: z.boolean(),
          work: z.boolean(),
          now: z.boolean(),
          contact: z.boolean(),
        }),
      }),
      about: z.strictObject({ ...page, intro: text, seeking: text }),
      work: z.strictObject(page),
      blog: z.strictObject({ ...page, intro: text }),
      notes: z.strictObject({ ...page, intro: text, empty: text }),
    }),
    faqs: z.array(z.strictObject({ question: name, answer: text })).max(60),
    images: z.strictObject({
      portrait: image,
      artwork: image,
      tech: z.array(image.extend({ href: link })).max(12),
    }),
  })
  .superRefine((v, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const unique = (items: string[], path: (string | number)[]) => {
      const seen = new Set<string>();
      items.forEach((id, i) => {
        if (seen.has(id.toLowerCase()))
          issue([...path, i], `Duplicate identifier: ${id}`);
        seen.add(id.toLowerCase());
      });
    };
    unique(
      v.work.projects.map((p) => p.slug),
      ["work", "projects"],
    );
    unique(
      v.work.groups.map((g) => g.id),
      ["work", "groups"],
    );
    unique(v.work.selected, ["work", "selected"]);
    unique(
      v.openSource.repositories.map((r) => r.repo),
      ["openSource", "repositories"],
    );
    const groups = new Set(v.work.groups.map((g) => g.id)),
      projects = new Set(v.work.projects.map((p) => p.slug));
    v.work.projects.forEach((p, i) => {
      if (!groups.has(p.group))
        issue(
          ["work", "projects", i, "group"],
          "Choose an existing project group",
        );
    });
    v.work.selected.forEach((s, i) => {
      if (!projects.has(s))
        issue(["work", "selected", i], "Choose an existing project slug");
    });
    const routes = new Set(["/", "/work", "/blog", "/notes", "/about"]);
    v.site.navigation.forEach((n, i) => {
      if (!routes.has(n.href))
        issue(
          ["site", "navigation", i, "href"],
          "Choose /, /work, /blog, /notes, or /about",
        );
    });
    v.images.tech.forEach((n, i) => {
      if (n.href.startsWith("/work/") && !projects.has(n.href.slice(6)))
        issue(["images", "tech", i, "href"], "This project does not exist");
    });
    v.openSource.repositories.forEach((r, i) => {
      if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(r.repo))
        issue(
          ["openSource", "repositories", i, "repo"],
          "Use a GitHub repository URL",
        );
    });
  });
export type SiteContent = z.infer<typeof siteContentSchema>;
export const calendarSchema = z.strictObject({
  username: z.string(),
  updatedAt: z.iso.datetime(),
  contributions: z
    .array(
      z.strictObject({
        date: z.iso.date(),
        count: z.number().int().min(0),
        level: z.number().int().min(0).max(4),
      }),
    )
    .min(365)
    .max(380),
});
export const pullRequestSchema = z.object({
  number: z.number().int().positive(),
  url: prUrl,
  title: z.string().max(2000),
  repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  status: z.enum(["open", "closed", "merged"]),
  createdAt: z.string(),
  mergedAt: z.string().optional(),
  attribution: z.enum(["co-authored", "credited"]).optional(),
  evidence: web.optional(),
});
export const pullRequestSnapshotSchema = z.strictObject({
  username: z.string(),
  updatedAt: z.iso.datetime(),
  prs: z.array(pullRequestSchema).max(20000),
});
export type CalendarSnapshot = z.infer<typeof calendarSchema>;
export type PullRequestSnapshot = z.infer<typeof pullRequestSnapshotSchema>;
export type SyncStatus = {
  attemptedAt: string;
  successAt?: string;
  error?: string;
  count?: number;
};
export function changedFields(
  before: unknown,
  after: unknown,
  path = "",
): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  )
    return [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].flatMap((k) =>
      changedFields(
        (before as Record<string, unknown>)[k],
        (after as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
      ),
    );
  return [path];
}
