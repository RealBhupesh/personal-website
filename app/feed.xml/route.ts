import { site } from "@/config/site";
import { getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const dynamic = "force-static";

export function GET() {
  const items = getPosts()
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `<item>
<title>${escapeXml(post.title)}</title>
<link>${url}</link>
<guid>${url}</guid>
<pubDate>${new Date(`${post.date}T00:00:00.000Z`).toUTCString()}</pubDate>
<description>${escapeXml(post.description)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml(site.name)}</title>
<link>${escapeXml(site.url)}</link>
<description>${escapeXml(site.description)}</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
