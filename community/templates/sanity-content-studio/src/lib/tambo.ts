import { ArticleCard } from "@/components/tambo/article-card";
import { ArticleList } from "@/components/tambo/article-list";
import { ContentPreview } from "@/components/tambo/content-preview";
import { type TamboComponent, type TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Zod Schemas
const articleSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  body: z.string(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().nullable(),
  _createdAt: z.string(),
  _updatedAt: z.string(),
});

// Component Schemas
const articleCardPropsSchema = z.object({
  title: z.string().optional().default("Untitled").describe("The article title"),
  excerpt: z.string().optional().default("").describe("Short summary of the article"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publication status"),
  publishedAt: z.string().nullable().optional().default(null).describe("Publication date in ISO format"),
  slug: z.string().optional().default("").describe("URL-friendly identifier"),
});

const articleListPropsSchema = z.object({
  articles: z.array(articleCardPropsSchema).default([]).describe("Array of articles to display"),
  view: z.enum(["grid", "list"]).optional().default("grid").describe("Display layout"),
});

const contentPreviewPropsSchema = z.object({
  title: z.string().optional().default("Untitled").describe("Content title"),
  excerpt: z.string().optional().default("").describe("Content summary"),
  body: z.string().optional().default("").describe("Full content body in markdown"),
  status: z.enum(["draft", "published"]).optional().default("draft").describe("Publication status"),
});

// API client functions (use API routes to avoid CORS)
async function fetchArticlesApi(params?: { 
  status?: "draft" | "published"; 
  limit?: number; 
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/articles?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch articles");
  }
  return response.json();
}

async function createArticleApi(data: { title: string; excerpt: string; body: string }) {
  const response = await fetch("/api/articles/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create article");
  }
  return response.json();
}

async function updateArticleApi(id: string, updates: Record<string, unknown>) {
  const response = await fetch("/api/articles/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!response.ok) {
    throw new Error("Failed to update article");
  }
  return response.json();
}

// Tambo Components
export const components: TamboComponent[] = [
  {
    name: "ArticleCard",
    description:
      "Displays a single article with title, excerpt, and status badge. Use for showing individual article details.",
    component: ArticleCard,
    propsSchema: articleCardPropsSchema,
  },
  {
    name: "ArticleList",
    description:
      "Displays a grid or list of articles from Sanity. Use when the user wants to see multiple articles, browse content, or view all posts.",
    component: ArticleList,
    propsSchema: articleListPropsSchema,
  },
  {
    name: "ContentPreview",
    description:
      "Shows a rich preview of content with title, excerpt, and formatted body. Use when creating or previewing an article.",
    component: ContentPreview,
    propsSchema: contentPreviewPropsSchema,
  },
];

// Tambo Tools (use API routes to avoid CORS issues)
export const tools: TamboTool[] = [
  {
    name: "fetchArticles",
    description:
      "Fetches articles from Sanity CMS. Can filter by status (draft/published), limit the number of results, or search by title/excerpt.",
    tool: async (params: { status?: "draft" | "published"; limit?: number; search?: string }) => {
      const articles = await fetchArticlesApi(params);
      return articles;
    },
    inputSchema: z.object({
      status: z.enum(["draft", "published"]).optional().describe("Filter by publication status"),
      limit: z.number().optional().describe("Maximum number of articles to return (default: 10)"),
      search: z.string().optional().describe("Search term to filter articles by title or excerpt"),
    }),
    outputSchema: z.array(articleSchema),
  },
  {
    name: "createArticle",
    description:
      "Creates a new article draft in Sanity CMS. Returns the created article with its ID.",
    tool: async (params: { title: string; excerpt: string; body: string }) => {
      const article = await createArticleApi(params);
      return article;
    },
    inputSchema: z.object({
      title: z.string().describe("The article title"),
      excerpt: z.string().describe("A short summary or description of the article"),
      body: z.string().describe("The full article content in markdown format"),
    }),
    outputSchema: articleSchema,
  },
  {
    name: "updateArticle",
    description:
      "Updates an existing article in Sanity CMS. Can update title, excerpt, body, or status.",
    tool: async (params: {
      id: string;
      title?: string;
      excerpt?: string;
      body?: string;
      status?: "draft" | "published";
    }) => {
      const { id, ...updates } = params;
      const article = await updateArticleApi(id, updates);
      return article;
    },
    inputSchema: z.object({
      id: z.string().describe("The Sanity document ID of the article to update"),
      title: z.string().optional().describe("New title for the article"),
      excerpt: z.string().optional().describe("New excerpt for the article"),
      body: z.string().optional().describe("New body content for the article"),
      status: z.enum(["draft", "published"]).optional().describe("New publication status"),
    }),
    outputSchema: articleSchema,
  },
];
