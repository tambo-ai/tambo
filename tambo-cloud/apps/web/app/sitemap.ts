import { getBlogPosts } from "@/lib/blog";
import { source } from "@/lib/source";
import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const domain = headersList.get("host") as string;
  const protocol = "https";
  const baseUrl = `${protocol}://${domain}`;

  // Get all blog posts
  const blogPosts = await getBlogPosts();

  // Get all docs pages
  const docsPages = source.getPages();

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

  // Blog post routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Docs routes
  const docsRoutes = docsPages.map((page) => {
    // Fumadocs pages use 'slugs' property instead of 'slug'
    const slugPath = page.slugs ? page.slugs.join("/") : "";
    return {
      url: `${baseUrl}/docs${slugPath ? `/${slugPath}` : ""}`,
      lastModified: new Date(), // Use page.data.lastModified if available
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...staticRoutes, ...blogRoutes, ...docsRoutes];
}
