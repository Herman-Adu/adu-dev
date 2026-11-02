import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Strapi media lands here once the CMS adapter is wired.
    remotePatterns: [],
  },
  // The contract layer is pure TS, so type errors must never be skipped.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
