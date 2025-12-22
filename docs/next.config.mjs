import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  trailingSlash: false,
  transpilePackages: ["fumadocs-ui"],
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
