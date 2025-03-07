import { createMDX } from "fumadocs-mdx/next";
import { createJiti } from "jiti";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const jiti = createJiti(fileURLToPath(import.meta.url));
const __dirname = dirname(fileURLToPath(import.meta.url));

// Import env here to validate during build. Using jiti we can import .ts files :)
jiti.import("./lib/env");

const withMDX = createMDX();
console.log("setting outputFileTracingRoot", path.join(__dirname, "../../.."));
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../.."),

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
    ],
  },
};

export default withMDX(config);
