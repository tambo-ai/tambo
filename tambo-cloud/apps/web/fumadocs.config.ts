import { remarkMermaid } from "@theguild/remark-mermaid";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const { docs, meta } = defineDocs({
  dir: "content/vnext", // Updated to match your actual docs directory
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      [
        remarkMermaid,
        {
          simple: true,
          mermaidConfig: {
            theme: "dark",
            themeVariables: {
              darkMode: true,
            },
          },
        },
      ],
    ],
  },
});
