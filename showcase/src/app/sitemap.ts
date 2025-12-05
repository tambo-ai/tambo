import type { MetadataRoute } from "next";

import { navigation, type NavigationItem } from "@/lib/navigation";
import { getBaseUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const paths = new Set<string>();

  const addPath = (href: string | undefined): void => {
    if (!href || href === "#") {
      return;
    }
    // Skip external or protocol-prefixed links (e.g. http:, https:, mailto:).
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
      return;
    }

    const normalized = href.startsWith("/") ? href : `/${href}`;

    paths.add(normalized);
  };

  const walkNavigation = (items: ReadonlyArray<NavigationItem>): void => {
    items.forEach((item) => {
      addPath(item.href);

      if (item.children) {
        walkNavigation(item.children);
      }
    });
  };

  walkNavigation(navigation);

  // Ensure the homepage is always present even if navigation changes.
  paths.add("/");

  // We do not track per-route content timestamps; use a single approximate value.
  const lastModified = new Date();

  return Array.from(paths).map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.8,
  }));
}
