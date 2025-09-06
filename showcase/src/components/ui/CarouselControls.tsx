"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

type CarouselControlsProps = {
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  slideContainerId: string;
};

export const CarouselControls = ({
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
  slideContainerId,
}: CarouselControlsProps) => {
  return (
    <div className="flex justify-between mt-4">
      <button
        className={cn(
          "px-4 py-2 bg-muted rounded disabled:opacity-50",
          isPrevDisabled && "cursor-not-allowed",
        )}
        aria-label="Previous slide"
        aria-controls={slideContainerId}
        disabled={isPrevDisabled}
        onClick={onPrev}
      >
        <ChevronLeft />
      </button>
      <button
        className={cn(
          "px-4 py-2 bg-muted rounded disabled:opacity-50",
          isNextDisabled && "cursor-not-allowed",
        )}
        aria-label="Next slide"
        aria-controls={slideContainerId}
        disabled={isNextDisabled}
        onClick={onNext}
      >
        <ChevronRight />
      </button>
    </div>
  );
};

CarouselControls.displayName = "CarouselControls";
