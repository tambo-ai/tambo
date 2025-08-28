"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

export interface ImageSource {
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageGalleryProps {
  sources: ImageSource[];
  className?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
}

const LazyImage = React.forwardRef<
  HTMLImageElement,
  {
    src: string;
    alt: string;
    className?: string;
  }
>(({ src, alt, className }, ref) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      ) : (
        <Image
          ref={ref}
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-contain transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className,
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
});
LazyImage.displayName = "LazyImage";

const downloadImage = async (src: string, filename: string) => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download image:", error);
  }
};

export const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  (
    {
      sources,
      className,
      autoplay: _autoplay = false,
      autoplayDelay: _autoplayDelay = 3000,
    },
    ref,
  ) => {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);

      api.on("select", () => {
        setCurrent(api.selectedScrollSnap() + 1);
      });
    }, [api]);

    const _currentImage = sources[current - 1] || sources[0];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden",
          className,
        )}
      >
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {sources.map((source, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-gray-900/50 to-black/50">
                  <LazyImage
                    src={source.src}
                    alt={source.alt}
                    className="rounded-lg"
                  />

                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                    onClick={async () =>
                      await downloadImage(source.src, `${source.alt}.jpg`)
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  {/* Caption */}
                  {source.caption && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/20 shadow-lg">
                      <p className="text-sm text-center">{source.caption}</p>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="left-4 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/30" />
          <CarouselNext className="right-4 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/30" />
        </Carousel>

        {/* Image Counter */}
        {sources.length > 1 && (
          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm border border-white/20 shadow-lg">
            {current} / {count}
          </div>
        )}

        {/* Thumbnail Strip */}
        {sources.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm p-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
              {sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105",
                    index === current - 1
                      ? "border-white shadow-xl ring-2 ring-white/30 scale-105"
                      : "border-white/20 hover:border-white/60 shadow-lg",
                  )}
                >
                  <Image
                    src={source.src}
                    alt={source.alt}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {/* Active indicator */}
                  {index === current - 1 && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  )}
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

export default ImageGallery;
