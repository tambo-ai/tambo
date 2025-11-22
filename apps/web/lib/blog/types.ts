// Blog category types
export type BlogCategory =
  | "new"
  | "feature"
  | "bug fix"
  | "update"
  | "event"
  | "tutorial"
  | "announcement";

// Blog post list item (for cards)
export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  category: BlogCategory;
  description?: string;
  date: string;
  author?: string;
  authorImage?: string;
}

// Sort options
export interface BlogSortOptions {
  field: "date" | "title";
  order: "asc" | "desc";
}
