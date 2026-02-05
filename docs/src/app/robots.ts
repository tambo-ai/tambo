import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for all bots
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // Explicitly allow OpenAI's GPTBot (used for ChatGPT training and browsing)
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      // Explicitly allow ChatGPT's browsing feature
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      // Explicitly allow Perplexity AI
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      // Explicitly allow Claude/Anthropic
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
      },
      // Explicitly allow Google's AI bot
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      // Explicitly allow Bing/Microsoft Copilot
      {
        userAgent: "Bingbot",
        allow: "/",
      },
      // Explicitly allow Meta AI
      {
        userAgent: "Meta-ExternalAgent",
        allow: "/",
      },
      // Explicitly allow Cohere
      {
        userAgent: "cohere-ai",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // Point AI crawlers to the LLM-optimized content
    host: baseUrl,
  };
}
