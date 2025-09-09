// @ts-nocheck
import fs from "fs";
import type { MetadataRoute } from "next";
import path from "path";

export const revalidate = 60 * 60 * 24; // 24 hours

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://tambo.co";
}

function isGroupSegment(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function getComponentRoutes(): string[] {
  const appDir = path.join(process.cwd(), "src", "app");
  const componentsDir = path.join(appDir, "components");

  if (!fs.existsSync(componentsDir)) {
    return [];
  }

  const pageFiles: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name === "page.tsx" || entry.name === "page.ts" || entry.name === "page.jsx" || entry.name === "page.js")
      ) {
        pageFiles.push(fullPath);
      }
    }
  }

  walk(componentsDir);

  const routes = new Set<string>();

  for (const filePath of pageFiles) {
    const routeDir = path.dirname(filePath);
    const relativeToApp = path.relative(appDir, routeDir); // e.g. "components/(blocks)/control-bar"
    const segments = relativeToApp.split(path.sep).filter(Boolean);

    // Remove group segments like (blocks)
    const filtered = segments.filter((seg: string) => !isGroupSegment(seg));

    // Ensure the route starts with components
    if (filtered[0] !== "components") continue;

    const routePath = "/" + filtered.join("/");
    routes.add(routePath);
  }

  return Array.from(routes).sort();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl().replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = [];

  // Root page
  entries.push({
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  });

  // Components pages
  const componentRoutes = getComponentRoutes();
  for (const route of componentRoutes) {
    entries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}

