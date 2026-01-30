"use client";

import { ArticleCard } from "@/components/tambo/article-card";
import { type Article } from "@/lib/sanity";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface ArticleCarouselProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
  sanityStudioUrl: string;
  emptyMessage?: string;
}

export function ArticleCarousel({ 
  articles, 
  onArticleClick, 
  sanityStudioUrl,
  emptyMessage = "No articles found."
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
       <div className="flex h-[80px] w-full items-center justify-center border border-zinc-800/50 rounded-[4px] bg-zinc-900/20 text-zinc-500 text-sm tracking-wide">
         {emptyMessage}
       </div>
    );
  }

  return (
    <div className="group relative w-full">
      {/* Scroll Buttons - Visible on Hover */}
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
        className="flex w-full overflow-x-auto gap-4 scrollbar-hide snap-x px-1 py-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {articles.map((article) => (
            <div key={article._id} className="min-w-[260px] md:min-w-[calc(25%-12px)] snap-start shrink-0 transition-transform duration-300 hover:-translate-y-1">
                <a 
                   href={`${sanityStudioUrl}/structure/article;${article._id}`}
                   target="_blank"
                   rel="noreferrer"
                   onClick={() => onArticleClick?.(article)}
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
