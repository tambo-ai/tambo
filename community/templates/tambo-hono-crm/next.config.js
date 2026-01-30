const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tambo-ai/react",
    "effect",
    "@standard-community/standard-json",
  ],
  experimental: {
    esmExternals: "loose",
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: path.resolve(__dirname, "node_modules/effect"),
    };

    // Ignore missing optional dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      sury: false,
    };

    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;
