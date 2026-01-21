import { getPostListItems } from "@/lib/get-posts";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Use hardcoded domain for production instead of dynamic headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:8260";

    // Get blog posts
    const posts = await getPostListItems();
    const blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/posts/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Static routes
    const staticRoutes = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/docs`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
    ];

    return [...staticRoutes, ...blogPosts];
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
