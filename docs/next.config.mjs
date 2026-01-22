import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@tambo-ai/ui-registry"],
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
