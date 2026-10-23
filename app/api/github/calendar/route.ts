import { githubUsername } from "@/config/github";
import snapshot from "@/data/github-calendar.json";
import { fetchCalendarSnapshot } from "@/lib/cms/github-admin";
import { calendarSchema } from "@/lib/cms/site-model";
export const revalidate = 3600;
export async function GET() {
  try {
    const result = await fetchCalendarSnapshot(githubUsername, async (url) => {
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error("Calendar provider unavailable");
      return response.json();
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
