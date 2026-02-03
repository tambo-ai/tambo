import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      rollupTypes: true,
      outDir: "dist",
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        message: resolve(__dirname, "src/message/index.tsx"),
        "reasoning-info": resolve(__dirname, "src/reasoning-info/index.tsx"),
        "toolcall-info": resolve(__dirname, "src/toolcall-info/index.tsx"),
        types: resolve(__dirname, "src/types/component-render-or-children.ts"),
        "use-render": resolve(__dirname, "src/use-render/use-render.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tambo-ai/react",
        "@tambo-ai/typescript-sdk",
        "@radix-ui/react-slot",
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
    sourcemap: true,
    minify: false,
  },
});
