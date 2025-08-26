"use client";

import { BlogFilters } from "@/components/blog/list/blog-filters";
import { BlogSearch } from "@/components/blog/list/blog-search";
import { BlogSort } from "@/components/blog/list/blog-sort";
import { BlogCard } from "@/components/blog/shared/blog-card";
import { FeaturedPostCard } from "@/components/blog/shared/featured-post-card";
import { GRADIENTS } from "@/lib/blog/constants";
import type {
  BlogCategory,
  BlogPostListItem,
  BlogSortOptions,
} from "@/lib/blog/types";
import { useMemo, useState } from "react";

interface BlogPageProps {
  posts: BlogPostListItem[];
  featuredPosts?: BlogPostListItem[];
}

export function BlogPage({ posts, featuredPosts = [] }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    BlogCategory | "all"
  >("all");
  const [sortOptions, setSortOptions] = useState<BlogSortOptions>({
    field: "date",
    order: "desc",
  });

  // Calculate post counts per category
  const postCounts = useMemo(() => {
    const counts: Record<BlogCategory | "all", number> = {
      all: posts.length,
      new: 0,
      feature: 0,
      "bug fix": 0,
      update: 0,
      event: 0,
      tutorial: 0,
      announcement: 0,
    };

    posts.forEach((post) => {
      counts[post.category]++;
    });

    return counts;
  }, [posts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLocaleLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLocaleLowerCase().includes(query) ||
          post.category.toLocaleLowerCase().includes(query) ||
          post.tags?.some((tag) => tag.toLocaleLowerCase().includes(query)),
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((post) => post.category === selectedCategory);
    }

    // Apply sorting
    return result.toSorted((a, b) => {
      let comparison = 0;

      if (sortOptions.field === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortOptions.field === "title") {
        comparison = a.title.localeCompare(b.title);
      }

      return sortOptions.order === "asc" ? comparison : -comparison;
    });
  }, [posts, searchQuery, selectedCategory, sortOptions]);

  const featuredPost = featuredPosts[0] || posts.find((post) => post.featured);

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

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            tambo updates
          </h1>
          <p className="text-muted-foreground text-lg">
            Latest features, fixes, changes, and events from the tambo team.
          </p>
        </header>

        {/* Search */}
        <div className="mb-12">
          <BlogSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Filters */}
        <div className="mb-12">
          <BlogFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            postCounts={postCounts}
          />
        </div>

        {/* Featured Post */}
        {featuredPost && selectedCategory === "all" && !searchQuery && (
          <div className="mb-12">
            <FeaturedPostCard post={featuredPost} />
          </div>
        )}

        {/* Results Info and Sort */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "post" : "posts"}
          </p>
          <BlogSort value={sortOptions} onChange={setSortOptions} />
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <BlogCard
              key={post.id}
              post={post}
              backgroundImage={"/tambo-bg.png"}
              gradient={GRADIENTS[index % GRADIENTS.length]}
            />
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
