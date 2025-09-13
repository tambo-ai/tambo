/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://ui.tambo.co",
  generateRobotsTxt: false,
  // Only include / and /components/**
  include: ["/", "/components", "/components/**"],
  exclude: ["/api/*", "/_next/*"],
  changefreq: "daily",
  priority: 0.7,
  transform: async (config, path) => {
    const entry = {
      loc: path,
      changefreq: "daily",
      priority: path === "/" ? 1.0 : 0.8,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
    return entry;
  },
};
/** @type {import('next-sitemap').IConfig} */
