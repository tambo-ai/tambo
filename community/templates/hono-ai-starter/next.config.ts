import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tambo-ai/sdk"],
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
