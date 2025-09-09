import { getBaseUrl, isProduction } from "@/lib/site";

export default function robots() {
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
