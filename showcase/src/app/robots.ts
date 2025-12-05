import type { MetadataRoute } from "next";
import { getBaseUrl, isProduction } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const allowIndexing = isProduction();

  return {
    rules: allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
        }
      : [
          {
            userAgent: "*",
            disallow: "/",
          },
        ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
