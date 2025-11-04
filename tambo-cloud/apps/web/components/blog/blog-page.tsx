"use client";

import { BlogSearch } from "@/components/blog/list/blog-search";
import { BlogCard } from "@/components/blog/shared/blog-card";
import type { BlogPostListItem } from "@/lib/blog/types";
import { useMemo, useState } from "react";

interface BlogPageProps {
  posts: BlogPostListItem[];
}

export function BlogPage({ posts }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery) {
      return posts;
    }

    const query = searchQuery.toLocaleLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLocaleLowerCase().includes(query) ||
        post.description?.toLocaleLowerCase().includes(query),
    );
  }, [posts, searchQuery]);

  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "tambo Blog",
    description:
      "Latest updates, tutorials, and insights about tambo - the AI orchestration framework for React frontends.",
    url: "/blog",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      author: {
        "@type": "Person",
        name: post.author || "tambo team",
      },
      datePublished: post.date,
      url: `/blog/posts/${post.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogListSchema),
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            tambo updates
          </h1>
          <p className="text-muted-foreground">
            Latest features, fixes, changes, and events from the tambo team.
          </p>
        </header>

        {/* Search */}
        <div className="mb-6 max-w-2xl mx-auto">
          <BlogSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "post" : "posts"}
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No posts found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
