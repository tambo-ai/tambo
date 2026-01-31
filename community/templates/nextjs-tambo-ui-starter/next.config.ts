// ===== FILE: next.config.ts =====
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Simple webpack config - just ignore the sury module
  webpack: (config) => {
    // Ignore the sury module completely
    config.resolve.fallback = {
      ...config.resolve.fallback,
      sury: false,
    };

    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
