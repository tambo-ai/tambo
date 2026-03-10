import { type NextConfig } from "next";
import { fileURLToPath } from "node:url";
import {
  getWorkspaceTranspilePackages,
  mergeConditions,
} from "../scripts/workspace-packages.mjs";

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
      config.resolve.conditionNames = mergeConditions(
        config.resolve.conditionNames,
        "@tambo-ai/source",
      );
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
