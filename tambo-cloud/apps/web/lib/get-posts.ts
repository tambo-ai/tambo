import type { BlogCategory, BlogPostListItem } from "@/lib/blog/types";
import { BLOG_DEFAULTS } from "@/lib/blog/defaults";
import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

// Define our blog post types
export interface BlogFrontMatter {
  title: string;
  date: string;
  description?: string;
  author?: string;
  authorImage?: string;
}

export interface BlogPost {
  name: string;
  route: string;
  frontMatter: BlogFrontMatter;
  content?: string;
}

// Helper to determine category from post name/slug
function determineCategory(name: string): BlogCategory {
  const slug = name.toLowerCase();

  // Map slug patterns to categories
  if (slug.includes("hack") || slug.includes("event")) return "event";
  if (slug.includes("support") || slug.includes("feature")) return "feature";
  if (slug.includes("announcement") || slug.includes("launch"))
    return "announcement";
  if (slug.includes("tutorial") || slug.includes("guide")) return "tutorial";
  if (slug.includes("fix")) return "bug fix";
  if (slug.includes("new")) return "new";

  // Default category
  return "update";
}

export async function getPosts(): Promise<BlogPost[]> {
  const pageMap = await getPageMap("/blog/posts");
  const { directories } = normalizePages({
    list: pageMap,
    route: "/blog/posts",
  });

  const posts = directories
    .filter(
      (item: { name?: string; frontMatter?: unknown }): item is BlogPost => {
        return item.name !== "index" && !!(item as any).frontMatter;
      },
    )
    .map((item) => ({
      name: item.name,
      route: item.route,
      content: (item as any).content || "",
      frontMatter: {
        title: item.frontMatter.title ?? "",
        date: item.frontMatter.date ?? new Date().toISOString(),
        description: item.frontMatter.description,
        author: item.frontMatter.author ?? BLOG_DEFAULTS.author,
        authorImage: item.frontMatter.authorImage ?? BLOG_DEFAULTS.authorImage,
      },
    }))
    .toSorted(
      (a, b) =>
        new Date(b.frontMatter.date).getTime() -
        new Date(a.frontMatter.date).getTime(),
    );

  return posts;
}

// Transform posts to BlogPostListItem format
export async function getPostListItems(): Promise<BlogPostListItem[]> {
  const posts = await getPosts();

  return posts.map((post) => {
    const slug = post.name;
    const category = determineCategory(post.name);

    return {
      id: slug,
      slug,
      title: post.frontMatter.title,
      category,
      date: post.frontMatter.date,
      description: post.frontMatter.description,
      author: post.frontMatter.author,
      authorImage: post.frontMatter.authorImage,
    };
  });
}
