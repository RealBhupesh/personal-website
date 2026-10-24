import type { NextConfig } from "next";
import content from "./data/site-content.json";

const nextConfig: NextConfig = {
  headers() {
    return ["/admin/:path*", "/api/cms/:path*", "/api/auth/:path*"].map(source => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
  redirects() {
    return [
      ...["/", "/about", "/work", "/blog", "/notes", "/work/:path*", "/blog/:path*", "/notes/:path*", "/feed.xml", "/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt"].map(source => ({
        source,
        has: [{ type: "host" as const, value: "personal-website-ten-rho-90\\.vercel\\.app" }],
        destination: `${content.site.url}${source}`,
        permanent: true,
      })),
      { source: "/experience", destination: "/about", permanent: true },
      { source: "/resume", destination: "/about", permanent: false },
    ];
  },
};

export default nextConfig;
