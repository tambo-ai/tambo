import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      return;
    }
    if (icon in icons)
      return createElement(
        icons[icon as keyof typeof icons],
      ) as React.ReactElement;
  },
});

// Guard against any content nested under a top-level "/docs" slug.
// Aggregate all offenders into a single actionable error message.
const docsPrefixedPages = source
  .getPages()
  .filter((page) => page.slugs[0] === "docs");

if (docsPrefixedPages.length > 0) {
  const list = docsPrefixedPages.map((p) => `- ${p.path}`).join("\n");
  throw new Error(
    `Docs content cannot be placed under a '/docs' route. Found ${docsPrefixedPages.length} page(s):\n${list}`,
  );
}
