import { type NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { getWorkspaceTranspilePackages } from "../scripts/workspace-packages.mjs";

const APP_DIR = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  // We need to disable reactStrictMode because react-leaflet uses a global
  // that doesn't work with strict mode.
  reactStrictMode: false,
  transpilePackages: getWorkspaceTranspilePackages(APP_DIR),
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (dev) {
      const conditionNames = config.resolve.conditionNames ?? [];
      config.resolve.conditionNames = conditionNames.includes("development")
        ? conditionNames
        : ["development", ...conditionNames];
    }

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
