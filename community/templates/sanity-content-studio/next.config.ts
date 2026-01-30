import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // Suppress warnings from @standard-community/standard-json optional deps
  webpack: (config) => {
    // These are optional dependencies that aren't used in this template
    config.resolve.fallback = {
      ...config.resolve.fallback,
      effect: false,
      sury: false,
      "@valibot/to-json-schema": false,
    };
    return config;
  },
};

export default nextConfig;
