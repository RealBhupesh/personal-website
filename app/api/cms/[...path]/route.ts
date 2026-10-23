import { SiteService, siteEditorSchema } from "@/lib/cms/site-service";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxOptions } from "@/lib/mdx";
import { mdxComponents } from "@/components/prose";
import { z } from "zod";
import {
  getCmsService,
  requireMutationOrigin,
  requireOwner,
} from "@/lib/cms/server";
import {
  articleSchema,
  articleState,
  CmsError,
  type Entry,
} from "@/lib/cms/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const response = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
const dto = (entry: Entry) => ({
  ...entry,
  state: articleState(entry.article),
});
async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new CmsError("Expected JSON content.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new CmsError("Empty request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 3 * 1024 * 1024) {
      await reader.cancel();
      throw new CmsError("This request is too large.", 413);
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function route(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    await requireOwner();
    if (request.method !== "GET") requireMutationOrigin(request);
    const service = await getCmsService();
    const { path } = await context.params;
    const [resource, id, action] = path;
    if (resource === "site") {
      const website = new SiteService(service.drafts, service.website);
      if (request.method === "GET" && id === "history")
        return response(await website.history());
      if (request.method === "GET")
        return response({
          ...(await website.get(
            new URL(request.url).searchParams.get("ref") ?? undefined,
          )),
          schema: siteEditorSchema(),
        });
      const body = await readJson(request);
      const revision = z.string().nullable().parse(body.revision);
      if (request.method === "PUT" && !id)
        return response(await website.save(body.content, revision));
      if (request.method === "POST" && id === "reset")
        return response(await website.reset(revision));
      if (request.method === "POST" && id === "restore")
        return response(
          await website.restore(z.string().parse(body.ref), revision),
        );
      if (request.method === "POST" && id === "publish")
        return response(await website.publish(revision));
      if (request.method === "POST" && id === "sync")
        return response(
          await website.sync(
            z.enum(["prs", "calendar", "all"]).parse(body.kind),
            revision,
          ),
        );
      if (request.method === "POST" && id === "pull-request")
        return response(await website.addPullRequest(body.credit, revision));
    }
    if (resource === "posts") {
      if (request.method === "GET" && !id)
        return response((await service.list()).map(dto));
      if (request.method === "GET" && id && action === "history")
        return response(await service.history(id));
      if (request.method === "GET" && id) {
        const ref = new URL(request.url).searchParams.get("ref") ?? undefined;
        return response(dto(await service.get(id, ref)));
      }
      const body = await readJson(request);
      if (request.method === "POST" && !id)
        return response(
          dto(
            await service.create(
              z
                .enum(["blank", "essay", "tutorial", "update", "note"])
                .parse(body.template ?? "blank"),
            ),
          ),
          201,
        );
      if (request.method === "PUT" && id) {
        const article = articleSchema.parse(body.article);
        if (article.id !== id) throw new CmsError("Article ID mismatch.");
        return response(
          dto(
            await service.save(
              article,
              z.string().nullable().parse(body.revision),
            ),
          ),
        );
      }
      if (request.method === "POST" && id && action === "duplicate")
        return response(dto(await service.duplicate(id)), 201);
      if (request.method === "POST" && id && action === "restore")
        return response(
          dto(
            await service.restore(
              id,
              z.string().parse(body.ref),
              z.string().parse(body.revision),
            ),
          ),
        );
      if (request.method === "POST" && id && action === "publish") {
        const candidate = await service.get(id);
        await service.preview(candidate.article);
        // Fail before the public commit if the actual article renderer rejects it.
        try {
          await compileMDX({
            source: candidate.article.body,
            components: mdxComponents,
            options: mdxOptions,
          });
        } catch {
          throw new CmsError(
            "The article cannot be rendered yet. Open Preview and fix the Markdown or code language before publishing.",
          );
        }
        return response(
          dto(await service.publish(id, z.string().parse(body.revision))),
        );
      }
      if (request.method === "POST" && id && action === "unpublish") {
        const result = await service.unpublish(
          id,
          z.string().parse(body.revision),
        );
        return response({ ...dto(result), commit: result.commit });
      }
    }
    if (resource === "import" && request.method === "POST")
      return response(await service.importExisting());
    if (resource === "media") {
      if (request.method === "GET" && !id)
        return response(await service.listMedia());
      if (request.method === "GET" && id) {
        const item = await service.getMedia(id);
        return new Response(Buffer.from(item.base64, "base64"), {
          headers: {
            "Content-Type": item.media.mime,
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex",
          },
        });
      }
      const body = await readJson(request);
      if (request.method === "POST" && !id) {
        const data = z
          .object({
            name: z.string().max(160),
            mime: z.string(),
            base64: z.string().max(2800000),
            alt: z.string().max(500),
            caption: z.string().max(1000),
          })
          .parse(body);
        return response(
          await service.upload(
            data.name,
            data.mime,
            Buffer.from(data.base64, "base64"),
            data.alt,
            data.caption,
          ),
          201,
        );
      }
      if (request.method === "PUT" && id) {
        const data = z
          .object({ alt: z.string().max(500), caption: z.string().max(1000) })
          .parse(body);
        return response(await service.updateMedia(id, data.alt, data.caption));
      }
    }
    if (resource === "deployment" && request.method === "GET" && id) {
      if (!/^(?:[a-f0-9]{40}|local)$/.test(id))
        throw new CmsError("Invalid commit.");
      return response(await service.website.status(id));
    }

    return response({ error: "This dashboard endpoint does not exist." }, 404);
  } catch (error) {
    if (error instanceof CmsError)
      return response({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return response(
        {
          issues: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (error instanceof SyntaxError)
      return response(
        { error: "The request could not be read. Check its format." },
        400,
      );
    console.error(
      "CMS operation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return response(
      {
        error:
          "The operation failed. Your recovery copy is still on this device. Please retry.",
      },
      500,
    );
  }
}
export { route as GET, route as POST, route as PUT };
