import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import { getWorkspaceTranspilePackages } from "../scripts/workspace-packages.mjs";

const withMDX = createMDX();
const APP_DIR = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: getWorkspaceTranspilePackages(APP_DIR),
  webpack(config) {
    config.resolve.conditionNames = [
      "development",
      ...config.resolve.conditionNames,
    ];
    return config;
  },
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [
      // Handle the trailing-slash variant explicitly to avoid a double redirect
      // when `trailingSlash: false` normalizes "/docs/" -> "/docs" first.
      {
        source: "/docs/",
        destination: "/",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "/",
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // Message Threads → Conversation Storage migration
      {
        source: "/concepts/message-threads/:path*",
        destination: "/concepts/conversation-storage",
        permanent: true,
      },
      // User Authentication reorganization
      {
        source: "/concepts/user-authentication/overview",
        destination: "/concepts/user-authentication",
        permanent: true,
      },
      {
        source: "/concepts/user-authentication/:provider",
        destination: "/guides/add-authentication/:provider",
        permanent: true,
      },
      // Tools reorganization
      {
        source: "/concepts/tools/adding-tools",
        destination: "/guides/take-actions/register-tools",
        permanent: true,
      },
      // Models reorganization
      {
        source: "/models/custom-llm-parameters",
        destination: "/guides/setup-project/llm-provider",
        permanent: true,
      },
      // Reference section consolidation - api-reference redirects
      {
        source: "/api-reference",
        destination: "/reference/react-sdk",
        permanent: true,
      },
      {
        source: "/api-reference/react-hooks",
        destination: "/reference/react-sdk/hooks",
        permanent: true,
      },
      {
        source: "/api-reference/typescript-types",
        destination: "/reference/react-sdk/types",
        permanent: true,
      },
      {
        source: "/api-reference/migration/:path*",
        destination: "/reference/react-sdk/migration/:path*",
        permanent: true,
      },
      {
        source: "/api-reference/problems/:path*",
        destination: "/reference/problems/:path*",
        permanent: true,
      },
      {
        source: "/cli",
        destination: "/reference/cli",
        permanent: true,
      },
      {
        source: "/cli/:path*",
        destination: "/reference/cli/:path*",
        permanent: true,
      },
      {
        source: "/models",
        destination: "/reference/llm-providers",
        permanent: true,
      },
      {
        source: "/models/:path*",
        destination: "/reference/llm-providers/:path*",
        permanent: true,
      },
      {
        source: "/reference/providers",
        destination: "/reference/llm-providers",
        permanent: true,
      },
      {
        source: "/reference/providers/:path*",
        destination: "/reference/llm-providers/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:path*.mdx",
        destination: "/llms.mdx/:path*",
      },
    ];
  },
};

export default withMDX(config);
