import { BlogPostListItem } from "@/lib/blog/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/blog/format-date";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPostListItem;
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link href={`/blog/posts/${post.slug}`} className="group block">
      <article
        className={cn(
          "h-full p-5 rounded-lg border bg-card hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 select-none flex flex-col",
          className,
        )}
      >
        <h3 className="font-bold text-xl mb-2">{post.title}</h3>
        {post.description && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
            {post.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t">
          {post.author && (
            <>
              <span className="font-medium">{post.author}</span>
              <span>•</span>
            </>
          )}
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </article>
    </Link>
  );
}
