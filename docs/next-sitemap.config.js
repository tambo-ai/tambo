/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";

// We enumerate Fumadocs pages at build time to produce a stable sitemap
// without relying on a runtime route. We read the content tree from
// the MDX source files which Fumadocs consumes, and deterministically
// map to expected routes.

const { join } = require("node:path");
const { readdirSync, statSync, readFileSync } = require("node:fs");

const contentRoot = join(__dirname, "content", "docs");

/**
 * Recursively collect .mdx files under content/docs and derive URLs.
 * Uses the same base URL structure used by Fumadocs app route.
 */
function collectDocPaths(dir, baseSegments = []) {
  const entries = readdirSync(dir);
  /** @type {string[]} */
  const paths = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      paths.push(...collectDocPaths(full, [...baseSegments, entry]));
    } else if (entry.endsWith(".mdx")) {
      const name = entry.replace(/\.mdx$/, "");
      const segments =
        name === "index" ? baseSegments : [...baseSegments, name];
      const url = "/" + segments.join("/");
      paths.push(url);
    }
  }
  return paths;
}

/**
 * Optionally try to parse frontmatter for lastmod.
 * If frontmatter contains `updated` or `date`, use it. Otherwise, file mtime.
 */
function getLastModForFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    // naive frontmatter parse: look for leading --- block
    if (content.startsWith("---")) {
      const end = content.indexOf("\n---", 3);
      if (end !== -1) {
        const frontmatter = content.slice(3, end).trim();
        const updatedMatch = frontmatter.match(
          /(^|\n)updated:\s*([\d-:TZ.+]+)/,
        );
        if (updatedMatch) return new Date(updatedMatch[2]).toISOString();
        const dateMatch = frontmatter.match(/(^|\n)date:\s*([\d-:TZ.+]+)/);
        if (dateMatch) return new Date(dateMatch[2]).toISOString();
      }
    }
  } catch {}
  try {
    const stats = statSync(filePath);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Build a deterministic list of routes with lastmod based on file times.
 */
function enumerateRoutes() {
  const routes = new Map();

  function walk(dir, baseSegments = []) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        walk(full, [...baseSegments, entry]);
      } else if (entry.endsWith(".mdx")) {
        const name = entry.replace(/\.mdx$/, "");
        const segments =
          name === "index" ? baseSegments : [...baseSegments, name];
        const url = "/" + segments.join("/");
        const lastmod = getLastModForFile(full);
        routes.set(url, lastmod);
      }
    }
  }

  walk(contentRoot, []);

  // ensure root index exists
  if (!routes.has("/")) {
    try {
      const rootIndex = join(contentRoot, "index.mdx");
      const lastmod = getLastModForFile(rootIndex);
      routes.set("/", lastmod);
    } catch {}
  }

  return Array.from(routes.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([url, lastmod]) => ({ url, lastmod }));
}

const enumerated = enumerateRoutes();

module.exports = {
  siteUrl,
  generateRobotsTxt: false,
  exclude: ["/_next/*", "/api/*"],
  changefreq: "weekly",
  priority: 0.8,
  transform: async (config, path) => {
    const found = enumerated.find((e) => e.url === path);
    return {
      loc: `${siteUrl}${path}`,
      changefreq: "weekly",
      priority: path === "/" ? 1.0 : 0.8,
      lastmod: found?.lastmod ?? new Date(0).toISOString(),
      alternateRefs: [],
    };
  },
  // explicitly include all enumerated paths for determinism
  additionalPaths: async () =>
    enumerated.map((e) => ({ loc: `${siteUrl}${e.url}`, lastmod: e.lastmod })),
  // include ensures index and known root routes are emitted
  include: enumerated.map((e) => e.url),
};
