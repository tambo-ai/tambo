import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Plugin } from "vite";
import path from "node:path";

// Plugin to handle browser-only packages during SSR only
function ssrBrowserShim(): Plugin {
  const stubModulePath = path.resolve(__dirname, "./app/lib/media-encoder-stub.ts");

  return {
    name: "ssr-browser-shim",
    enforce: "pre",
    resolveId(source, importer, options) {
      // ONLY stub during SSR, not on client
      if (options?.ssr) {
        // Stub out all media encoder related packages
        if (
          source === "media-encoder-host" ||
          source === "media-encoder-host-broker" ||
          source === "extendable-media-recorder" ||
          source === "react-media-recorder" ||
          source.includes("media-encoder") ||
          source.includes("media-recorder")
        ) {
          return stubModulePath;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [ssrBrowserShim(), reactRouter()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api/tambo": {
        target: "https://api.tambo.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tambo/, ""),
      },
    },
  },
  ssr: {
    // Keep Tambo packages in SSR bundle so our shim can work
    noExternal: [/@tambo-ai\/.*/, "react-media-recorder", "extendable-media-recorder"],
  },
  optimizeDeps: {
    include: [
      "react-media-recorder",
      "zod-to-json-schema",
      "@tambo-ai/react"
    ],
  },
});
