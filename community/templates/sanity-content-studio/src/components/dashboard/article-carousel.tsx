"use client";

import { ArticleCard } from "@/components/tambo/article-card";
import { type Article } from "@/lib/sanity";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface ArticleCarouselProps {
  articles: Article[];
  sanityStudioUrl: string;
  emptyMessage?: string;
  viewMode?: "list" | "grid";
}

export function ArticleCarousel({
  articles,
  sanityStudioUrl,
  emptyMessage = "No articles found.",
  viewMode = "list"
}: ArticleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth / 2;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (articles.length === 0) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center border border-zinc-800/50 rounded-[4px] bg-zinc-900/20 text-zinc-500 text-sm tracking-wide">
        {emptyMessage}
      </div>
    );
  }

  // Bento grid:random sizes to articles
  const getCardSize = (index: number) => {
    const sizes = ["wide", "tall", "normal", "wide", "normal", "tall"];
    return sizes[index % sizes.length];
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px] grid-flow-dense h-[calc(100vh-220px)] overflow-y-auto scrollbar-hide pb-20 pr-1">
        {articles.map((article, index) => {
          const size = getCardSize(index);
          return (
            <a
              key={article._id}
              href={`${sanityStudioUrl}/structure/article;${article._id}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "transition-transform duration-300 hover:-translate-y-1 block h-full w-full",
                size === "large" && "md:col-span-2 md:row-span-2", // Kept just in case, but unused in pattern
                size === "wide" && "md:col-span-2",
                size === "tall" && "md:row-span-2"
              )}
            >
              <ArticleCard {...article} />
            </a>
          );
        })}
      </div>
    );
  }

  // List view: horizontal carousel
  return (
    <div className="group relative w-full">
      {/* Scroll Buttons */}
      <div className={cn(
        "absolute -left-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:flex",
        !canScrollLeft && "pointer-events-none opacity-0"
      )}>
        <button
          onClick={() => scroll("left")}
          className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className={cn(
        "absolute -right-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:flex",
        !canScrollRight && "pointer-events-none opacity-0"
      )}>
        <button
          onClick={() => scroll("right")}
          className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex w-full h-[500px] overflow-x-auto gap-4 scrollbar-hide snap-x px-1 py-4 items-stretch"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {articles.map((article) => (
          <div
            key={article._id}
            className="min-w-[200px] md:min-w-[calc(33.333%-11px)] snap-start shrink-0 transition-transform duration-300 hover:-translate-y-1"
          >
            <a
              href={`${sanityStudioUrl}/structure/article;${article._id}`}
              target="_blank"
              rel="noreferrer"
              className="block h-full"
            >
              <ArticleCard {...article} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
