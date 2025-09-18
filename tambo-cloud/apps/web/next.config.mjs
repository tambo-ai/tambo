import { withSentryConfig } from "@sentry/nextjs";
import { createJiti } from "jiti";
import nextra from "nextra";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

const jiti = createJiti(fileURLToPath(import.meta.url));

// Import env here to validate the environment variables during build. Using jiti we can import .ts files :)
jiti.import("./lib/env").catch(console.error);

/** @type {import('next').NextConfig} */
const config = {
  redirects: () => {
    return [
      {
        source: "/docs",
        destination:
          process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co",
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination:
          process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co",
        permanent: true,
      },
      {
        source: "/blog/posts",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/book",
        destination: "https://cal.com/michaelmagan",
        permanent: false,
      },
      {
        source: "/discord",
        destination: "https://discord.gg/dJNvPEHth6",
        permanent: false,
      },
      {
        source: "/gh",
        destination: "https://github.com/tambo-ai/tambo",
        permanent: false,
      },
      {
        source: "/issue",
        destination: "https://github.com/tambo-ai/tambo/issues/new",
        permanent: false,
      },
      {
        source: "/license",
        destination:
          process.env.NEXT_PUBLIC_LICENSE_URL ||
          "https://docs.google.com/document/d/1UHvU9pKnuZ4wHRjxRk_8nqmeDK8KTmHc/edit?usp=sharing&ouid=105761745283245441798&rtpof=true&sd=true",
        permanent: false,
      },
      {
        source: "/privacy",
        destination:
          process.env.NEXT_PUBLIC_PRIVACY_URL ||
          "https://docs.google.com/document/d/1OFX8Y-uc7_TLDFUKxq3dYI0ozbpN8igD/edit?usp=sharing&ouid=105761745283245441798&rtpof=true&sd=true",
        permanent: false,
      },
      {
        source: "/slack-waitlist",
        destination: "/",
        permanent: false,
      },
      {
        source: "/start",
        destination:
          "https://stackblitz.com/~/github.com/tambo-ai/tambo-template",
        permanent: false,
      },
      {
        source: "/terms",
        destination:
          process.env.NEXT_PUBLIC_TERMS_URL ||
          "https://docs.google.com/document/d/1GOjwt8tHx3AQ1SeZJ0rXhxuuSfRYnjLIaF02chvFqYo/edit?usp=sharing",
        permanent: false,
      },
      {
        source: "/x",
        destination: "https://x.com/tambo_ai",
        permanent: false,
      },
      {
        source: "/mcp",
        destination: "/#mcp",
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  // This lets us use `npm link` and still get hot reloading - it allows
  // ../../node_modules to be included in the list of watched files
  outputFileTracingRoot: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../",
  ),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "weatherapi.com",
      },
    ],
  },
  // Configure webpack to use SVGR for SVG imports
  webpack(config) {
    // Modify the rules for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

// Nextra configuration for MDX support
const withNextra = nextra({
  defaultShowCopyCode: true,
  readingTime: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeKatex,
      [
        rehypePrettyCode,
        {
          theme: {
            light: "github-light",
            dark: "github-dark",
          },
          keepBackground: false,
          defaultLang: "ts",
        },
      ],
    ],
  },
});

export default withSentryConfig(withNextra(config), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.NEXT_PUBLIC_SENTRY_ORG,

  project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
