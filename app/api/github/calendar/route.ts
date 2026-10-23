import { githubUsername } from "@/config/github";
import snapshot from "@/data/github-calendar.json";
import { calendarSchema } from "@/lib/cms/site-model";
export const revalidate = 3600;
export async function GET() {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(githubUsername)}?y=last`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok) throw Error("Calendar provider unavailable");
    const raw = await response.json();
    const result = calendarSchema.parse({
      username: githubUsername,
      updatedAt: new Date().toISOString(),
      contributions: raw.contributions,
    });
    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    const saved = calendarSchema.safeParse(snapshot);
    if (saved.success && saved.data.username === githubUsername)
      return Response.json(
        { ...saved.data, stale: true },
        { headers: { "Cache-Control": "public, max-age=60" } },
      );
    return Response.json(
      { error: "Contribution calendar unavailable. Please retry." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
