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
        url: `${baseUrl}/docs`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ];

    return [...staticRoutes];
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
