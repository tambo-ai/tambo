const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@tanstack/react-query": path.resolve(
        __dirname,
        "node_modules/@tanstack/react-query",
      ),
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      "@modelcontextprotocol/sdk": path.resolve(
        __dirname,
        "node_modules/@modelcontextprotocol/sdk",
      ),
    };

    return config;
  },
};

module.exports = nextConfig;
