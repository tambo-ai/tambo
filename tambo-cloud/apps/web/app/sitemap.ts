import { getBlogPosts } from "@/lib/blog";
import { source } from "@/lib/source";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Use hardcoded domain for production instead of dynamic headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

    // Static routes
    const staticRoutes = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/docs`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ];

    let blogRoutes: MetadataRoute.Sitemap = [];
    let docsRoutes: MetadataRoute.Sitemap = [];

    // Try to get blog posts, but don't fail if it errors
    try {
      // Get all blog posts
      const blogPosts = await getBlogPosts();

      // Blog post routes
      blogRoutes = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error("Error getting blog posts for sitemap:", error);
    }

    // Try to get docs pages, but don't fail if it errors
    try {
      // Get all docs pages
      const docsPages = source.getPages();

      // Docs routes
      docsRoutes = docsPages.map((page) => {
        // Fumadocs pages use 'slugs' property instead of 'slug'
        const slugPath = page.slugs.join("/");
        return {
          url: `${baseUrl}/docs${slugPath ? `/${slugPath}` : ""}`,
          lastModified: new Date(), // Use page.data.lastModified if available
          changeFrequency: "monthly" as const,
          priority: 0.7,
        };
      });
    } catch (error) {
      console.error("Error getting docs pages for sitemap:", error);
    }

    return [...staticRoutes, ...blogRoutes, ...docsRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return at least the homepage as fallback
    return [
      {
        url: "https://tambo.co",
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 1.0,
      },
    ];
  }
}
