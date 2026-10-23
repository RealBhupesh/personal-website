import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  articleSchema,
  mediaSchema,
  newArticle,
  importArticle,
  validatePublication,
  validateBody,
  referencedMedia,
  contentDigest,
  serializeArticle,
  idSchema,
  CmsError,
  type Entry,
  type Media,
} from "./model.ts";
import { jsonFile, type Repository, type Change } from "./repository.ts";

type StoredMedia = { media: Media; base64: string };
export class CmsService {
  readonly drafts: Repository;
  readonly website: Repository;
  constructor(drafts: Repository, website: Repository) {
    this.drafts = drafts;
    this.website = website;
  }
  path(id: string) {
    idSchema.parse(id);
    return `articles/${id}.json`;
  }
  async list(): Promise<Entry[]> {
    const paths = await this.drafts.list("articles");
    const entries = await Promise.all(
      paths
        .filter((p) => /^articles\/[\w-]+\.json$/.test(p))
        .map(async (path) => {
          const file = await this.drafts.read(path);
          if (!file)
            throw new CmsError(
              "An article changed while loading. Refresh the library.",
              409,
            );
          return {
            article: articleSchema.parse(JSON.parse(file.content)),
            revision: file.sha,
          };
        }),
    );
    return entries.sort((a, b) =>
      b.article.updatedAt.localeCompare(a.article.updatedAt),
    );
  }
  async get(id: string, ref?: string): Promise<Entry> {
    if (ref && !/^[a-f0-9-]{20,64}$/.test(ref))
      throw new CmsError("Invalid revision.");
    const file = await this.drafts.read(this.path(id), ref);
    if (!file) throw new CmsError("Article not found.", 404);
    return {
      article: articleSchema.parse(JSON.parse(file.content)),
      revision: file.sha,
    };
  }
  async save(value: unknown, expected: string | null): Promise<Entry> {
    const parsed = articleSchema.parse(value);
    const existing = await this.drafts.read(this.path(parsed.id));
    if ((existing?.sha ?? null) !== expected)
      throw new CmsError(
        "This draft changed in another window. Reload the saved version or export your text.",
        409,
      );
    const previous = existing
      ? articleSchema.parse(JSON.parse(existing.content))
      : null;
    // Publication state is server-owned. A browser cannot forge a merge or bypass URL locks.
    const article = {
      ...parsed,
      published: previous?.published,
      createdAt: previous?.createdAt ?? parsed.createdAt,
      updatedAt: new Date().toISOString(),
    };
    if (article.archived && article.published)
      throw new CmsError("Unpublish the article before archiving it.");
    if (article.published && article.slug !== article.published.slug)
      throw new CmsError(
        "The published URL is locked to protect existing links.",
      );
    const revision = await this.drafts.write(
      this.path(article.id),
      jsonFile(article),
      expected,
      `Save: ${article.title || "Untitled draft"}`,
    );
    return { article, revision };
  }
  async create(template: string) {
    return this.save(newArticle(randomUUID(), template), null);
  }
  async duplicate(id: string) {
    const { article } = await this.get(id);
    const now = new Date().toISOString();
    return this.save(
      {
        ...article,
        id: randomUUID(),
        title: `${article.title || "Untitled"} (copy)`,
        slug: "",
        published: undefined,
        archived: false,
        createdAt: now,
        updatedAt: now,
      },
      null,
    );
  }
  async importExisting() {
    const entries = await this.list();
    const known = new Set(
      entries.map((e) => e.article.published?.slug ?? e.article.slug),
    );
    const paths = (await this.website.list("content/blog")).filter((p) =>
      /^content\/blog\/[a-z0-9-]+\.mdx$/.test(p),
    );
    let count = 0;
    for (const path of paths) {
      const slug = path
        .split("/")
        .at(-1)!
        .replace(/\.mdx$/, "");
      if (known.has(slug)) continue;
      const file = await this.website.read(path);
      if (!file) continue;
      const article = importArticle(slug, file.content, file.sha);
      await this.drafts.write(
        this.path(article.id),
        jsonFile(article),
        null,
        `Import: ${article.title}`,
      );
      count++;
    }
    return { count };
  }
  async history(id: string) {
    return this.drafts.history(this.path(id));
  }
  async restore(id: string, ref: string, expected: string) {
    const past = await this.get(id, ref);
    const current = await this.get(id);
    return this.save(
      {
        ...past.article,
        id,
        archived: current.article.archived,
        published: current.article.published,
        slug: current.article.published?.slug ?? past.article.slug,
      },
      expected,
    );
  }
  async listMedia() {
    const paths = await this.drafts.list("media");
    return (
      await Promise.all(
        paths
          .filter((p) => /^media\/[\w-]+\.json$/.test(p))
          .map(async (path) => {
            const file = await this.drafts.read(path);
            return file ? mediaSchema.parse(JSON.parse(file.content)) : null;
          }),
      )
    )
      .filter((item) => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getMedia(id: string): Promise<StoredMedia> {
    idSchema.parse(id);
    const file = await this.drafts.read(`media/${id}.json`);
    const data = await this.drafts.read(`media/${id}.data`);
    if (!file || !data) throw new CmsError("Image not found.", 404);
    return {
      media: mediaSchema.parse(JSON.parse(file.content)),
      base64: data.content,
    };
  }
  async upload(
    name: string,
    mime: string,
    bytes: Uint8Array,
    alt: string,
    caption: string,
  ) {
    if (bytes.length > 2 * 1024 * 1024 || bytes.length < 12)
      throw new CmsError("Choose an image smaller than 2 MB.");
    const b = Buffer.from(bytes);
    const signatures: Record<string, boolean> = {
      "image/png": b
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "image/jpeg": b[0] === 255 && b[1] === 216 && b[2] === 255,
      "image/webp":
        b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP",
      "image/gif": ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)),
    };
    if (!signatures[mime])
      throw new CmsError(
        "The file contents do not match a supported PNG, JPEG, WebP, or GIF image.",
      );
    try {
      await sharp(b, { limitInputPixels: 40000000 }).metadata();
    } catch {
      throw new CmsError(
        "This image is damaged or exceeds the 40-megapixel size limit.",
      );
    }
    const id = randomUUID();
    const ext = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
    }[mime];
    const media = mediaSchema.parse({
      id,
      name,
      mime,
      alt,
      caption,
      createdAt: new Date().toISOString(),
      path: `media/${id}.${ext}`,
    });
    await this.drafts.publish(
      [
        { path: `media/${id}.json`, content: jsonFile(media) },
        { path: `media/${id}.data`, content: b.toString("base64") },
      ],
      await this.drafts.head(),
      `Upload: ${name}`,
    );
    return media;
  }
  async updateMedia(id: string, alt: string, caption: string) {
    idSchema.parse(id);
    const file = await this.drafts.read(`media/${id}.json`);
    if (!file) throw new CmsError("Image not found.", 404);
    const media = mediaSchema.parse({
      ...JSON.parse(file.content),
      alt,
      caption,
    });
    await this.drafts.write(
      `media/${id}.json`,
      jsonFile(media),
      file.sha,
      `Describe: ${media.name}`,
    );
    return media;
  }
  async preview(value: unknown) {
    const article = articleSchema.parse(value);
    validateBody(article.body);
    return article;
  }
  async publish(id: string, expected: string) {
    const entry = await this.get(id);
    if (entry.revision !== expected)
      throw new CmsError("Save the latest draft before publishing.", 409);
    const article = entry.article;
    validatePublication(article);
    const entries = await this.list();
    if (
      entries.some(
        (e) =>
          e.article.id !== id &&
          (e.article.slug === article.slug ||
            e.article.published?.slug === article.slug),
      )
    )
      throw new CmsError("Another article already uses this URL.", 409);
    const head = await this.website.head();
    const path = `content/blog/${article.slug}.mdx`;
    const live = await this.website.read(path);
    const source = serializeArticle(article);
    const alreadyPublished = live?.content === source;
    if (live && !alreadyPublished && live.sha !== article.published?.sourceSha)
      throw new CmsError(
        "The live article changed outside the dashboard, or this URL is already in use. Import or review that version first.",
        409,
      );
    const assets = referencedMedia(article);
    const changes: Change[] = [{ path, content: source }];
    for (const asset of assets) {
      const filename = asset.split("/").at(-1)!;
      const mediaId = filename.replace(/\.[^.]+$/, "");
      const stored = await this.getMedia(mediaId);
      if (stored.media.path !== `media/${filename}`)
        throw new CmsError(
          "An image reference does not match its uploaded file.",
        );
      changes.push({
        path: `public${asset}`,
        content: stored.base64,
        encoding: "base64",
      });
    }
    const commit = alreadyPublished
      ? head
      : await this.website.publish(
          changes,
          head,
          `Publish: ${article.title}\n\ncms:${article.id}:${contentDigest(article)}`,
        );
    const publishedFile = await this.website.read(path);
    if (!publishedFile || publishedFile.content !== source)
      throw new CmsError(
        `Publication commit ${commit} was created but could not be verified. Retry to reconcile it.`,
        502,
      );
    article.published = {
      slug: article.slug,
      digest: contentDigest(article),
      at: new Date().toISOString(),
      commit,
      sourceSha: publishedFile.sha,
    };
    const revision = await this.drafts.write(
      this.path(id),
      jsonFile(article),
      expected,
      `Published: ${article.title}`,
    );
    return { article, revision };
  }
  async unpublish(id: string, expected: string) {
    const entry = await this.get(id);
    if (entry.revision !== expected)
      throw new CmsError("Save the latest draft before unpublishing.", 409);
    const { article } = entry;
    if (!article.published)
      throw new CmsError("This article is already a draft.");
    const path = `content/blog/${article.published.slug}.mdx`;
    const head = await this.website.head();
    const live = await this.website.read(path);
    if (live && live.sha !== article.published.sourceSha)
      throw new CmsError(
        "The live article changed outside the dashboard. Review it before unpublishing.",
        409,
      );
    const commit = live
      ? await this.website.publish(
          [{ path, content: null }],
          head,
          `Unpublish: ${article.title}`,
        )
      : head;
    delete article.published;
    const revision = await this.drafts.write(
      this.path(id),
      jsonFile(article),
      expected,
      `Unpublished: ${article.title}`,
    );
    return { article, revision, commit };
  }
}
