"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";
import { ArticleCard } from "./article-card";

interface Article {
  title: string;
  excerpt: string;
  status: "draft" | "published";
  publishedAt: string | null;
  slug: string;
}

interface ArticleListProps {
  articles: Article[];
  view?: "grid" | "list";
}

export function ArticleList({ articles, view = "grid" }: ArticleListProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-[hsl(var(--muted))] p-12 text-center">
        <div className="rounded-full bg-[hsl(var(--background))] p-3">
          <LayoutGrid className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">
          No articles found
        </h3>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Try creating a new article or adjusting your search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {articles.length} article{articles.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))] p-1">
          <button
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "grid"
                ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "list"
                ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          view === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-3"
        )}
      >
        {articles.map((article, index) => (
          <ArticleCard key={article.slug || index} {...article} />
        ))}
      </div>
    </div>
  );
}
