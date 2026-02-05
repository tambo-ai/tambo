import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:8260";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/internal/", "/trpc/", "/_next/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
