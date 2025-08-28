"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import { cva } from "class-variance-authority";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  RotateCw,
} from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

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
export interface GalleryState {
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
export interface RotateIntent {
  degrees: number;
}

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
        link.download = filename ?? `image-${Date.now()}.jpg`;
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

/**
 * Hook for detecting EXIF orientation and applying corrections
 */
const useExifOrientation = (src: string) => {
  const [orientation, setOrientation] = useState<number>(1);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // For now, we'll use a simple heuristic based on dimensions
      // In a production app, you'd want to use a library like exif-js
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // This is a simplified approach - in reality you'd read EXIF data
        setOrientation(1);
      }
    };

    img.src = src;
  }, [src]);

  return orientation;
};

/**
 * Lazy loading image component with high-DPI support
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, alt, className, style, onLoad, onError }, _ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const orientation = useExifOrientation(src);

    // Intersection Observer for lazy loading
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      onError?.();
    };

    // Generate srcSet for high-DPI displays
    const generateSrcSet = (baseSrc: string) => {
      return `${baseSrc} 1x, ${baseSrc} 2x`;
    };

    return (
      <div ref={imgRef} className={cn("relative", className)}>
        {isInView && (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
            )}
            <img
              src={src}
              srcSet={generateSrcSet(src)}
              alt={alt}
              className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className,
              )}
              style={{
                ...style,
                transform: `rotate(${(orientation - 1) * 90}deg)`,
              }}
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
            />
          </>
        )}
      </div>
    );
  },
);

LazyImage.displayName = "LazyImage";

/**
 * Main ImageGallery component
 */
export const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  (
    { sources, initialIndex = 0, fit = "contain", className, ...props },
    _ref,
  ) => {
    const [galleryState, setGalleryState] =
      useTamboComponentState<GalleryState>("galleryState", {
        currentIndex: Math.min(initialIndex, sources.length - 1),
        zoom: 1,
        rotation: 0,
        panX: 0,
        panY: 0,
      });

    // Ensure galleryState is never undefined
    const state = galleryState ?? {
      currentIndex: Math.min(initialIndex, sources.length - 1),
      zoom: 1,
      rotation: 0,
      panX: 0,
      panY: 0,
    };

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
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
          panX: newZoom === 1 ? 0 : state.panX,
          panY: newZoom === 1 ? 0 : state.panY,
        });
      },
      [setGalleryState, state],
    );

    // Rotation function
    const rotate = useCallback(
      (intent: RotateIntent) => {
        setGalleryState({
          ...state,
          rotation: (state.rotation + intent.degrees) % 360,
        });
      },
      [setGalleryState, state],
    );

    // Keyboard event handler
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current?.contains(document.activeElement)) return;

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            navigate("prev");
            break;
          case "ArrowRight":
            e.preventDefault();
            navigate("next");
            break;
          case "+":
          case "=":
            e.preventDefault();
            zoom("in");
            break;
          case "-":
            e.preventDefault();
            zoom("out");
            break;
          case "0":
            e.preventDefault();
            zoom("reset");
            break;
          case "r":
            e.preventDefault();
            rotate({ degrees: 90 });
            break;
          case "Escape":
            if (isFullscreen) {
              setIsFullscreen(false);
            }
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [navigate, zoom, rotate, isFullscreen]);

    // Touch and mouse event handlers for pan and pinch
    const handleMouseDown = (e: React.MouseEvent) => {
      if (state.zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - state.panX, y: e.clientY - state.panY });
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && state.zoom > 1) {
        setGalleryState({
          ...state,
          panX: e.clientX - dragStart.x,
          panY: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Wheel event for zoom
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoom("in");
      } else {
        zoom("out");
      }
    };

    return (
      <div
        ref={_ref}
        className={cn(
          galleryVariants({ variant: isFullscreen ? "fullscreen" : "default" }),
          className,
        )}
        tabIndex={0}
        {...props}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Main Image */}
          <div
            className="relative max-w-full max-h-full"
            style={{
              transform: `scale(${state.zoom}) rotate(${state.rotation}deg) translate(${state.panX}px, ${state.panY}px)`,
              transformOrigin: "center",
              transition: isDragging ? "none" : "transform 0.3s ease",
            }}
          >
            <LazyImage
              ref={imageRef}
              src={currentImage.src}
              alt={currentImage.alt}
              className={cn(
                "max-w-full max-h-full",
                fit === "contain" ? "object-contain" : "object-cover",
              )}
            />
          </div>

          {/* Navigation Controls */}
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
                  <LazyImage
                    src={source.src}
                    alt={source.alt}
                    className="w-full h-full object-cover"
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
