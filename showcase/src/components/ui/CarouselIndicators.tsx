"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type CarouselIndicatorsProps = {
  totalPages: number;
  currentPage: number;
  onGoToIndex: (index: number) => void;
};

export const CarouselIndicators = ({
  totalPages,
  currentPage,
  onGoToIndex,
}: CarouselIndicatorsProps) => {
  return (
    <div
      className="flex justify-center gap-2 mt-4"
      role="group"
      aria-label="Slide navigation"
    >
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          className={cn(
            "w-2 h-2 rounded-full",
            currentPage === index ? "bg-foreground" : "bg-muted-foreground",
          )}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={currentPage === index}
          onClick={() => onGoToIndex(index)}
        />
      ))}
    </div>
  );
};

CarouselIndicators.displayName = "CarouselIndicators";
