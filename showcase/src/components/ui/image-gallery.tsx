"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  Minus,
  Plus,
} from "lucide-react";
import { useTamboComponentState } from "@tambo-ai/react";
import Image from "next/image";
import { cva } from "class-variance-authority";

/**
 * Zod schema for image source objects
 */
const ImageSourceSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  alt: z.string().min(1, "Alt text is required"),
  caption: z.string().optional(),
});

/**
 * Zod schema for ImageGallery props
 */
export const ImageGalleryPropsSchema = z.object({
  sources: z
    .array(ImageSourceSchema)
    .min(1, "At least one image source is required"),
  initialIndex: z.number().int().min(0).default(0),
  fit: z.enum(["contain", "cover"]).default("contain"),
  className: z.string().optional(),
});

export type ImageGalleryProps = z.infer<typeof ImageGalleryPropsSchema> & {
  children?: React.ReactNode;
};

export type ImageSource = z.infer<typeof ImageSourceSchema>;

/**
 * Gallery state interface for component state management
 */
interface GalleryState {
  currentIndex: number;
  zoom: number;
  rotation: number;
  panX: number;
  panY: number;
}

/**
 * Navigation intents for the gallery
 */
export type NavigationIntent =
  | "next"
  | "prev"
  | { type: "index"; index: number };
export type ZoomIntent = "in" | "out" | "reset";
export type RotateIntent = { degrees: number };

/**
 * CSS variants for the gallery container
 */
const galleryVariants = cva(
  "relative w-full h-full bg-black/90 rounded-lg overflow-hidden",
  {
    variants: {
      variant: {
        default: "min-h-[400px]",
        fullscreen: "fixed inset-0 z-50 min-h-screen",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Hook for handling image download functionality
 */
export const useImageDownload = () => {
  const downloadImage = useCallback(
    async (src: string, filename?: string): Promise<void> => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename || `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download image:", error);
      }
    },
    [],
  );

  return { downloadImage };
};

// LazyImage component for performance
const LazyImage = React.forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
  }
>(({ src, alt, className, onLoad, onError }, _ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          hasError ? "hidden" : "block",
          className,
        )}
        onLoad={handleLoad}
        onError={handleError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </>
  );
});

LazyImage.displayName = "LazyImage";

/**
 * Main ImageGallery component
 */
export const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  (
    { sources, initialIndex = 0, fit = "contain", className, ...props },
    ref,
  ) => {
    // Always call the hook to satisfy React rules
    const [galleryState, setGalleryState] =
      useTamboComponentState<GalleryState>("galleryState", {
        currentIndex: Math.min(initialIndex, sources.length - 1),
        zoom: 1,
        rotation: 0,
        panX: 0,
        panY: 0,
      });

    // Ensure galleryState is never undefined
    const state = React.useMemo(
      () =>
        galleryState || {
          currentIndex: Math.min(initialIndex, sources.length - 1),
          zoom: 1,
          rotation: 0,
          panX: 0,
          panY: 0,
        },
      [galleryState, initialIndex, sources.length],
    );

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const { downloadImage } = useImageDownload();

    const currentImage = sources[state.currentIndex];

    // Navigation functions
    const navigate = useCallback(
      (intent: NavigationIntent) => {
        let newIndex = state.currentIndex;

        if (intent === "next") {
          newIndex = (state.currentIndex + 1) % sources.length;
        } else if (intent === "prev") {
          newIndex =
            state.currentIndex === 0
              ? sources.length - 1
              : state.currentIndex - 1;
        } else if (typeof intent === "object" && intent.type === "index") {
          newIndex = Math.max(0, Math.min(intent.index, sources.length - 1));
        }

        setGalleryState({
          ...state,
          currentIndex: newIndex,
          zoom: 1,
          rotation: 0,
          panX: 0,
          panY: 0,
        });
      },
      [sources.length, setGalleryState, state],
    );

    // Zoom functions
    const zoom = useCallback(
      (intent: ZoomIntent) => {
        let newZoom = state.zoom;

        if (intent === "in") {
          newZoom = Math.min(state.zoom * 1.5, 5);
        } else if (intent === "out") {
          newZoom = Math.max(state.zoom / 1.5, 0.5);
        } else if (intent === "reset") {
          newZoom = 1;
        }

        setGalleryState({
          ...state,
          zoom: newZoom,
          panX: intent === "reset" ? 0 : state.panX,
          panY: intent === "reset" ? 0 : state.panY,
        });
      },
      [setGalleryState, state],
    );

    // Rotation functions
    const rotate = useCallback(
      (intent: RotateIntent) => {
        setGalleryState({
          ...state,
          rotation: (state.rotation + intent.degrees) % 360,
        });
      },
      [setGalleryState, state],
    );

    // Mouse/touch event handlers
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (state.zoom > 1) {
          setIsDragging(true);
          setDragStart({
            x: e.clientX - state.panX,
            y: e.clientY - state.panY,
          });
        }
      },
      [state.zoom, state.panX, state.panY],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isDragging && state.zoom > 1) {
          setGalleryState({
            ...state,
            panX: e.clientX - dragStart.x,
            panY: e.clientY - dragStart.y,
          });
        }
      },
      [isDragging, dragStart, setGalleryState, state],
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Keyboard event handlers
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowLeft":
            navigate("prev");
            break;
          case "ArrowRight":
            navigate("next");
            break;
          case "+":
          case "=":
            zoom("in");
            break;
          case "-":
            zoom("out");
            break;
          case "0":
            zoom("reset");
            break;
          case "r":
          case "R":
            rotate({ degrees: 90 });
            break;
          case "Escape":
            if (isFullscreen) {
              setIsFullscreen(false);
            }
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, zoom, rotate, isFullscreen]);

    // Wheel event for zoom
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoom("in");
        } else {
          zoom("out");
        }
      },
      [zoom],
    );

    return (
      <div
        ref={ref}
        className={cn(
          galleryVariants({ variant: isFullscreen ? "fullscreen" : "default" }),
          className,
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        {...props}
      >
        {/* Main Image Display */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <Image
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            className={cn(
              "max-w-full max-h-full transition-transform duration-200 ease-out",
              fit === "cover" ? "object-cover" : "object-contain",
              isDragging
                ? "cursor-grabbing"
                : state.zoom > 1
                  ? "cursor-grab"
                  : "cursor-default",
            )}
            style={{
              transform: `scale(${state.zoom}) rotate(${state.rotation}deg) translate(${state.panX / state.zoom}px, ${state.panY / state.zoom}px)`,
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Navigation Arrows */}
          {sources.length > 1 && (
            <>
              <button
                onClick={() => navigate("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigate("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <button
              onClick={() => zoom("out")}
              className="text-white hover:text-gray-300 p-1"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(state.zoom * 100)}%
            </span>
            <button
              onClick={() => zoom("in")}
              className="text-white hover:text-gray-300 p-1"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/30 mx-1" />
            <button
              onClick={() => rotate({ degrees: 90 })}
              className="text-white hover:text-gray-300 p-1"
              aria-label="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={async () =>
                await downloadImage(currentImage.src, `${currentImage.alt}.jpg`)
              }
              className="text-white hover:text-gray-300 p-1"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Image Counter */}
          {sources.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              {state.currentIndex + 1} / {sources.length}
            </div>
          )}

          {/* Caption */}
          {currentImage.caption && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-md text-center text-sm">
              {currentImage.caption}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {sources.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => navigate({ type: "index", index })}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                    index === state.currentIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/50",
                  )}
                >
                  <Image
                    src={source.src}
                    alt={source.alt}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

ImageGallery.displayName = "ImageGallery";

export type { GalleryState };
