import type { BlogPostListItem } from "@/lib/blog/types";
import Link from "next/link";
import { BlogBadge } from "./blog-badge";

interface FeaturedPostCardProps {
  post: BlogPostListItem;
}

export function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  return (
    <Link href={`/blog/posts/${post.slug}`}>
      <article className="relative overflow-hidden rounded-2xl h-64 bg-gradient-to-br from-emerald-300 via-cyan-300 to-blue-300 p-8 hover:shadow-xl transition-shadow cursor-pointer group">
        {/* Background SVG image on the right with zoom effect */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-40 transition-transform duration-300 ease-out group-hover:scale-105">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "url('/assets/landing/drawings/OCTO-TRANSPARENT-8.svg')",
              backgroundSize: "contain",
              backgroundPosition: "right center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <BlogBadge
              category={post.category}
              className="bg-white/90 text-gray-700"
            />
            <span className="text-xs font-semibold bg-white/90 px-2 py-1 rounded-full">
              FEATURED
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {post.title}
          </h2>
          <p className="text-gray-600 text-sm">{post.date}</p>
        </div>
      </article>
    </Link>
  );
}
