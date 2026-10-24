import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const allow = { allow: "/", disallow: ["/admin", "/api/cms", "/api/auth"] };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...allow },
      { userAgent: "GPTBot", ...allow },
      { userAgent: "ChatGPT-User", ...allow },
      { userAgent: "OAI-SearchBot", ...allow },
      { userAgent: "ClaudeBot", ...allow },
      { userAgent: "Claude-SearchBot", ...allow },
      { userAgent: "Claude-User", ...allow },
      { userAgent: "anthropic-ai", ...allow },
      { userAgent: "PerplexityBot", ...allow },
      { userAgent: "Google-Extended", ...allow },
      { userAgent: "Applebot-Extended", ...allow },
      { userAgent: "Bingbot", ...allow },
    ],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
