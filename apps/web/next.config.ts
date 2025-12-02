import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://cdn.midjourney.com/**"),
      new URL("https://res.cloudinary.com/**"),
      new URL("https://cdn.sanity.io/**"),
    ],
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/:path*",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
