import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Prevent bundling of Node.js modules on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Force usages of @duckdb/duckdb-wasm to use the browser build
    // This applies to both client and server builds to prevent the Node.js bundle
    // from being picked up during SSR (which causes critical dependency warnings)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@duckdb/duckdb-wasm": "@duckdb/duckdb-wasm/dist/duckdb-browser.mjs",
    };

    return config;
  },
};

export default nextConfig;
