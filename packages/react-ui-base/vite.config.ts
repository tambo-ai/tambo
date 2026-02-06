import { tamboViteConfig } from "@tambo-ai/vite-config";
import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

export default mergeConfig(
  {
    plugins: [react()],
  },
  tamboViteConfig({
    entry: ["./src/index.ts"],
  }),
);
