import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { icons } from "lucide-react";
import { createElement } from "react";
import { mainDocs, mainMeta } from "../.source";

export const source = loader({
  baseUrl: "/docs",
  source: createMDXSource(mainDocs, mainMeta),
  icon(icon) {
    if (!icon) {
      // You may set a default icon
      return;
    }
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});
