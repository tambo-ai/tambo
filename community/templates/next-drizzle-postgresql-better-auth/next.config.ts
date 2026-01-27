import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Run ESLint separately via `npm run lint` (avoids deprecated next lint)

  // Stub optional peer deps from @standard-community/standard-json
  turbopack: {
    resolveAlias: {
      effect: "./src/lib/noop.ts",
      sury: "./src/lib/noop.ts",
      "@valibot/to-json-schema": "./src/lib/noop.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: false,
      sury: false,
      "@valibot/to-json-schema": false,
    };
    return config;
  },
};

export default nextConfig;
