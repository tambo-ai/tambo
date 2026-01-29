import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for certain ESM modules in the Edge Runtime
  serverExternalPackages: ["@tambo-ai/sdk"],
  // Ensures clean Hono routing without trailing slash issues
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
