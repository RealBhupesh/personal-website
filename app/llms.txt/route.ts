import { llmsTxt } from "@/lib/llms";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new Response(await llmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
