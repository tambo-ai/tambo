import { createClient } from "@sanity/client";

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable");
}

// Public client for read operations
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

// Authenticated client for mutations (server-side only)
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// Types
export interface Article {
  _id: string;
  _type: "article";
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: "draft" | "published";
  publishedAt: string | null;
  _createdAt: string;
  _updatedAt: string;
}

// GROQ Queries
const articleFields = `
  _id,
  _type,
  title,
  "slug": slug.current,
  excerpt,
  body,
  status,
  publishedAt,
  _createdAt,
  _updatedAt
`;

export async function fetchArticles(options?: {
  status?: "draft" | "published";
  limit?: number;
  search?: string;
}): Promise<Article[]> {
  const filters: string[] = ['_type == "article"'];

  if (options?.status) {
    filters.push(`status == "${options.status}"`);
  }

  if (options?.search) {
    filters.push(`title match "*${options.search}*" || excerpt match "*${options.search}*"`);
  }

  const query = `*[${filters.join(" && ")}] | order(_createdAt desc) [0...${options?.limit ?? 10}] {
    ${articleFields}
  }`;

  return sanityClient.fetch(query);
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const query = `*[_type == "article" && _id == $id][0] {
    ${articleFields}
  }`;

  return sanityClient.fetch(query, { id });
}

export async function createArticle(data: {
  title: string;
  excerpt: string;
  body: string;
}): Promise<Article> {
  const slugValue = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const doc = {
    _type: "article" as const,
    title: data.title,
    slug: { _type: "slug", current: slugValue },
    excerpt: data.excerpt,
    body: data.body,
    status: "draft" as const,
    publishedAt: null,
  };

  const result = await sanityWriteClient.create(doc);
  
  // Transform the result to match our Article interface
  return {
    _id: result._id,
    _type: "article",
    title: result.title,
    slug: slugValue,
    excerpt: result.excerpt,
    body: result.body,
    status: result.status,
    publishedAt: result.publishedAt,
    _createdAt: result._createdAt,
    _updatedAt: result._updatedAt,
  };
}

export async function updateArticle(
  id: string,
  updates: Partial<Pick<Article, "title" | "excerpt" | "body" | "status">>
): Promise<Article> {
  return sanityWriteClient
    .patch(id)
    .set(updates)
    .commit() as Promise<Article>;
}
