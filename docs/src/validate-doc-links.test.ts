import { execSync } from "child_process";
import { globSync } from "glob";
import path from "path";

/**
 * Validates that all docs.tambo.co URLs in the codebase point to valid routes.
 * Routes are derived from the MDX file structure in docs/content/docs/.
 */
describe("docs.tambo.co link validation", () => {
  const docsRoot = path.resolve(__dirname, "../content/docs");
  const repoRoot = path.resolve(__dirname, "../..");

  // Build set of valid routes from MDX files
  const validRoutes = new Set<string>();
  const mdxFiles = globSync("**/*.mdx", { cwd: docsRoot });

  for (const file of mdxFiles) {
    // Convert file path to route: foo/bar/index.mdx -> /foo/bar, foo/bar.mdx -> /foo/bar
    const route =
      "/" +
      file.replace(/\/index\.mdx$/, "").replace(/\.mdx$/, "");
    validRoutes.add(route);
  }

  // Static files that are valid but not MDX routes
  const staticFiles = new Set(["/llms.txt", "/llms-full.txt", "/sitemap.xml", "/sitemap-0.xml"]);

  // Extract all docs.tambo.co URLs from codebase
  const grepOutput = execSync(
    `grep -rho 'https://docs\\.tambo\\.co/[^"'"'"'\`\\)\\s>]*' --include='*.ts' --include='*.tsx' --include='*.md' --include='*.mdx' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=.next . 2>/dev/null || true`,
    { cwd: repoRoot, encoding: "utf-8" }
  );

  const docUrls = [...new Set(grepOutput.trim().split("\n").filter(Boolean))];

  it("should have found some URLs to validate", () => {
    expect(docUrls.length).toBeGreaterThan(0);
  });

  // Test each unique URL
  for (const url of docUrls) {
    it(`${url} should be a valid docs route`, () => {
      const urlObj = new URL(url);
      // Strip hash and trailing slash
      const pathname = urlObj.pathname.replace(/\/$/, "") || "/";

      const isValid = validRoutes.has(pathname) || staticFiles.has(pathname);

      if (!isValid) {
        // Suggest similar routes
        const lastSegment = pathname.split("/").pop() ?? "";
        const suggestions = [...validRoutes]
          .filter((r) => r.includes(lastSegment))
          .slice(0, 3);

        const suggestionMsg =
          suggestions.length > 0 ? `\nDid you mean: ${suggestions.join(", ")}` : "";

        fail(`Invalid docs route: ${pathname}${suggestionMsg}`);
      }
    });
  }
});
