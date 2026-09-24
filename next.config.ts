import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      { source: "/experience", destination: "/about", permanent: true },
      { source: "/resume", destination: "/about", permanent: false },
    ];
  },
};

export default nextConfig;
