import { MetadataRoute } from "next";
import { source } from "@/lib/source";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages();

  const routes: MetadataRoute.Sitemap = [];

  pages.forEach((page) => {
    if (page.url) {
      routes.push({
        url: `${baseUrl}${page.url}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  });

  return routes;
}
