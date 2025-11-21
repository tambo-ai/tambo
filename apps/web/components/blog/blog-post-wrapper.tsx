import { BlogPost } from "./blog-post";

interface BlogPostWithFrontmatterProps {
  children: React.ReactNode;
  meta: {
    title?: string;
    author?: string;
    date?: string;
  };
}

/**
 * BlogPostWithFrontmatter component for MDX blog posts.
 *
 * This is a layout wrapper that receives frontmatter data via the `meta` prop.
 * The frontmatter is automatically exported by the remark-mdx-frontmatter plugin,
 * and this component is automatically injected into blog posts by the
 * remarkInjectBlogLayout plugin, so you don't need to manually import or use it.
 *
 * For blog posts under /blog/posts/, just write your frontmatter and content:
 *
 * @example
 * ```mdx
 * ---
 * title: "My Blog Post"
 * author: "John Doe"
 * date: "2025-10-30"
 * ---
 *
 * Your blog post content here...
 * ```
 *
 * The plugin automatically wraps it with this layout component.
 */
export function BlogPostWithFrontmatter({
  children,
  meta,
}: BlogPostWithFrontmatterProps) {
  return <BlogPost frontmatter={meta}>{children}</BlogPost>;
}
