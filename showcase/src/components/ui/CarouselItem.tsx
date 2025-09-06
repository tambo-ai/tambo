"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { CarouselDataType } from "./Carousel";

const carouselItemContentVariants = cva("", {
  variants: {
    size: {
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
      xxl: "p-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const isVideo = (url: string) => {
  if (!url) return false;
  const videoExtensions = [".mp4", ".webm", ".ogg"];
  try {
    const pathname = new URL(url, "http://dummy.base").pathname;
    return videoExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
  } catch {
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }
};

type CarouselItemProps = {
  item: CarouselDataType["items"][0];
  size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  isSelected: boolean;
  onClick: () => void;
  visibleCount: number;
};

export const CarouselItem = ({
  item,
  size,
  isSelected,
  onClick,
  visibleCount,
}: CarouselItemProps) => {
  const slideWidth = `calc((100% - ((${visibleCount} - 1) * 1rem)) / ${visibleCount})`;
  const effectiveType =
    item.mediaType || (item.media && isVideo(item.media) ? "video" : "image");

  return (
    <button
      role="group"
      aria-roledescription="slide"
      aria-label={item.title}
      className={cn(
        "bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-full relative overflow-hidden group",
        isSelected && "border-2 border-primary",
      )}
      style={{ flexShrink: 0, width: slideWidth }}
      onClick={onClick}
    >
      {item.media ? (
        <>
          {effectiveType === "video" ? (
            <video
              src={item.media}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={item.media}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent",
              carouselItemContentVariants({ size }),
            )}
          >
            <h4 className="text-white font-bold truncate">{item.title}</h4>
            {item.description && (
              <p className="text-white/80 text-sm line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </>
      ) : (
        <div
          className={cn(
            "h-full flex flex-col items-center justify-center text-center bg-muted/50",
            carouselItemContentVariants({ size }),
          )}
        >
          <h4 className="font-bold text-foreground truncate">{item.title}</h4>
          {item.description && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      )}
    </button>
  );
};

CarouselItem.displayName = "CarouselItem";
