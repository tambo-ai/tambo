import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Use hardcoded domain for production instead of dynamic headers
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:8260";

  return [
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
}
