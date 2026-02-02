import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  // We need to disable reactStrictMode because react-leaflet uses a global
  // that doesn't work with strict mode.
  reactStrictMode: false,
  transpilePackages: ["@tambo-ai/ui-registry"],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // don't resolve optional peers from '@standard-community/standard-json'
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: false,
      sury: false,
    };
    return config;
  },
};

export default nextConfig;
