"use client";

import { Button } from "@/components/ui/button";
import { CATEGORY_DISPLAY_MAP } from "@/lib/blog/constants";
import type { BlogCategory } from "@/lib/blog/types";

interface BlogFiltersProps {
  selectedCategory: BlogCategory | "all";
  onCategoryChange: (category: BlogCategory | "all") => void;
  postCounts: Record<BlogCategory | "all", number>;
}

export function BlogFilters({
  selectedCategory,
  onCategoryChange,
  postCounts,
}: BlogFiltersProps) {
  const categories: Array<BlogCategory | "all"> = [
    "all",
    ...(Object.keys(CATEGORY_DISPLAY_MAP) as BlogCategory[]),
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {categories.map((category) => {
        const displayName =
          category === "all" ? "All" : CATEGORY_DISPLAY_MAP[category];
        const count = postCounts[category] || 0;

        return (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className="rounded-full"
          >
            {displayName}
            <span className="ml-2 text-xs opacity-60">{count}</span>
          </Button>
        );
      })}
    </div>
  );
}
