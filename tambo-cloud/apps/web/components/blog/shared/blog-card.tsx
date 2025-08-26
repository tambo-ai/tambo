import { BlogPostListItem } from "@/lib/blog/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BlogBadge } from "./blog-badge";

interface BlogCardProps {
  post: BlogPostListItem;
  backgroundImage?: string;
  gradient?: string;
  className?: string;
}

export function BlogCard({
  post,
  backgroundImage,
  gradient,
  className,
}: BlogCardProps) {
  const defaultBackground = "bg-gradient-to-br from-gray-100 to-gray-200";

  return (
    <Link href={`/blog/posts/${post.slug}`}>
      <article className={cn("group cursor-pointer", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl h-48 p-6",
            "hover:shadow-lg transition-shadow",
            !backgroundImage && defaultBackground,
          )}
        >
          {/* Background image layer with zoom effect */}
          {backgroundImage && (
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          )}

          {/* Gradient overlay on top of background image */}
          {backgroundImage && gradient && (
            <div className={cn("absolute inset-0", gradient)} />
          )}

          <div className="relative z-10 h-full flex flex-col">
            <BlogBadge
              category={post.category}
              className="mb-auto bg-white/90 text-gray-700 text-xs w-fit"
            />
            {post.featured && (
              <span className="text-xs font-bold text-gray-600 mt-2">
                FEATURED
              </span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold line-clamp-2 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">{post.date}</p>
        </div>
      </article>
    </Link>
  );
}
