import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: [
    "better-sqlite3",
    "@cloudflare/next-on-pages",
    "twilio",
    "https-proxy-agent",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;