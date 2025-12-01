import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const fallbackBaseUrl =
    process.env.NODE_ENV === "production"
      ? "https://ui.tambo.co"
      : "http://localhost:3000";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || fallbackBaseUrl;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/internal/", "/trpc/", "/dashboard/", "/_next/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
