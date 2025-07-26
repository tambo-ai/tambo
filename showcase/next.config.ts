import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  // We need to disable reactStrictMode because react-leaflet uses a global
  // that doesn't work with strict mode.
  reactStrictMode: false,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
