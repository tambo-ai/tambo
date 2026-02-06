import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Console app should not be indexed - it's an authenticated dashboard
      disallow: ["/"],
    },
  };
}
