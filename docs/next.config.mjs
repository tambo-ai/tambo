import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import {
  getWorkspaceTranspilePackages,
  mergeConditions,
} from "../scripts/workspace-packages.mjs";

const withMDX = createMDX();
const APP_DIR = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: getWorkspaceTranspilePackages(APP_DIR),
  webpack(config, { dev }) {
    if (dev) {
      config.resolve.conditionNames = mergeConditions(
        config.resolve.conditionNames,
        "@tambo-ai/source",
      );
    }
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

      // --- Group A: Top-level shortcut aliases (common AI agent guesses) ---
      {
        source: "/quickstart",
        destination: "/getting-started/quickstart",
        permanent: true,
      },
      {
        source: "/integrate",
        destination: "/getting-started/integrate",
        permanent: true,
      },
      {
        source: "/generative-interfaces",
        destination: "/concepts/generative-interfaces",
        permanent: true,
      },
      {
        source: "/mcp",
        destination: "/concepts/model-context-protocol",
        permanent: true,
      },
      {
        source: "/user-authentication",
        destination: "/concepts/user-authentication",
        permanent: true,
      },
      {
        source: "/authentication",
        destination: "/concepts/user-authentication",
        permanent: true,
      },
      {
        source: "/tools",
        destination: "/concepts/tools",
        permanent: true,
      },
      {
        source: "/conversation-storage",
        destination: "/concepts/conversation-storage",
        permanent: true,
      },
      {
        source: "/self-hosting",
        destination: "/guides/self-hosting",
        permanent: true,
      },

      // --- Group B: Wrong-slug / synonym redirects ---
      {
        source: "/concepts/component-state",
        destination: "/concepts/generative-interfaces/component-state",
        permanent: true,
      },
      {
        source: "/concepts/state",
        destination: "/concepts/generative-interfaces/component-state",
        permanent: true,
      },
      {
        source: "/concepts/conversation-persistence",
        destination: "/concepts/conversation-storage",
        permanent: true,
      },
      {
        source: "/concepts/authentication",
        destination: "/concepts/user-authentication",
        permanent: true,
      },
      {
        source: "/guides/component-registration",
        destination: "/guides/enable-generative-ui/register-components",
        permanent: true,
      },

      // --- Group C: Folder-index redirects (folders without index.mdx) ---
      {
        source: "/getting-started",
        destination: "/getting-started/quickstart",
        permanent: true,
      },
      {
        source: "/concepts",
        destination: "/concepts/generative-interfaces",
        permanent: true,
      },
      {
        source: "/best-practices",
        destination: "/best-practices/coding-agent-generative-ui-rules",
        permanent: true,
      },
      {
        source: "/guides",
        destination: "/guides/coding-agent-skills",
        permanent: true,
      },
      {
        source: "/guides/setup-project",
        destination: "/guides/setup-project/create-project",
        permanent: true,
      },
      {
        source: "/guides/enable-generative-ui",
        destination: "/guides/enable-generative-ui/register-components",
        permanent: true,
      },
      {
        source: "/guides/build-interfaces",
        destination: "/guides/build-interfaces/build-chat-interface",
        permanent: true,
      },
      {
        source: "/guides/give-context",
        destination: "/guides/give-context/make-ai-aware-of-state",
        permanent: true,
      },
      {
        source: "/guides/take-actions",
        destination: "/guides/take-actions/register-tools",
        permanent: true,
      },
      {
        source: "/examples-and-templates",
        destination: "/examples-and-templates/chat-starter-app",
        permanent: true,
      },
      {
        source: "/reference",
        destination: "/reference/react-sdk",
        permanent: true,
      },
      {
        source: "/reference/cli/commands",
        destination: "/reference/cli/commands/create-app",
        permanent: true,
      },
      {
        source: "/reference/problems",
        destination: "/reference/problems/validation",
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
