import { source } from "@/lib/source";
import type { InferPageType } from "fumadocs-core/source";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export async function getLLMText(page: InferPageType<typeof source>) {
  const MDXContent = page.data.body as React.ComponentType<any>;
  const html = renderToStaticMarkup(
    React.createElement(MDXContent, { components: {} }),
  );

  return `# ${page.data.title}
URL: ${page.url}

${html}`;
}
