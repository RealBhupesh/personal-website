import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const allow = { allow: "/" } as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...allow },
      { userAgent: "GPTBot", ...allow },
      { userAgent: "ChatGPT-User", ...allow },
      { userAgent: "OAI-SearchBot", ...allow },
      { userAgent: "ClaudeBot", ...allow },
      { userAgent: "Claude-SearchBot", ...allow },
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
