"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "./lib/utils";
import { Card, CardContent } from "./components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./components/ui/carousel";
import { useTamboInteractable } from "@tambo-ai/react";

/**
 * Zod schema for CarouselView component props
 */
export const CarouselViewProps = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string().describe("Unique identifier for the item"),
          title: z.string().describe("Title or main text for the item"),
          description: z
            .string()
            .optional()
            .describe("Optional description or subtitle"),
          media: z
            .object({
              type: z
                .enum(["image", "video", "icon"])
                .describe("Type of media content"),
              url: z.string().url().describe("URL to the media content"),
              alt: z.string().optional().describe("Alt text for accessibility"),
            })
            .optional()
            .describe("Optional media content for the item"),
          data: z
            .record(z.unknown())
            .optional()
            .describe("Additional data associated with the item"),
        }),
      )
      .min(1)
      .describe("Array of items to display in the carousel"),
    visibleCount: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe(
        "Number of items visible at once. Defaults to 1 on mobile, responsive on larger screens",
      ),
    loop: z
      .boolean()
      .optional()
      .describe(
        "Whether the carousel should loop infinitely. Defaults to false",
      ),
    autoplay: z
      .boolean()
      .optional()
      .describe("Whether the carousel should autoplay. Defaults to false"),
    autoplayDelay: z
      .number()
      .int()
      .min(1000)
      .max(10000)
      .optional()
      .describe("Autoplay delay in milliseconds. Defaults to 3000"),
  })
  .describe(
    "A responsive carousel component for displaying a collection of items",
  );

export type CarouselViewPropsType = z.infer<typeof CarouselViewProps>;

/**
 * CarouselView component props interface
 */
export interface CarouselViewComponentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    CarouselViewPropsType {
  /** Callback when an item is selected */
  onItemSelect?: (item: CarouselViewPropsType["items"][0]) => void;
  /** Custom render function for items */
  renderItem?: (
    item: CarouselViewPropsType["items"][0],
    index: number,
  ) => React.ReactNode;
}

/**
 * Context for carousel navigation intents
 */
interface CarouselViewContextValue {
  api: CarouselApi | undefined;
  currentIndex: number;
  itemCount: number;
  navigateNext: () => void;
  navigatePrevious: () => void;
  navigateToIndex: (index: number) => void;
  selectItem: (id: string) => void;
  selectedItem: CarouselViewPropsType["items"][0] | null;
}

const CarouselViewContext =
  React.createContext<CarouselViewContextValue | null>(null);

/**
 * Hook to access carousel context and intents
 */
export const useCarouselView = () => {
  const context = React.useContext(CarouselViewContext);
  if (!context) {
    throw new Error("useCarouselView must be used within a CarouselView");
  }
  return context;
};

/**
 * Default item renderer
 */
const DefaultItemRenderer: React.FC<{
  item: CarouselViewPropsType["items"][0];
  index: number;
  onSelect: (item: CarouselViewPropsType["items"][0]) => void;
}> = ({ item, index, onSelect }) => {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item);
        }
      }}
      aria-label={`Carousel item ${index + 1}: ${item.title}`}
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        {item.media && (
          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {item.media.type === "image" ? (
              <img
                src={item.media.url}
                alt={item.media.alt ?? item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : item.media.type === "video" ? (
              <video
                src={item.media.url}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
                🎯
              </div>
            )}
          </div>
        )}
        <h3 className="text-center text-lg font-semibold">{item.title}</h3>
        {item.description && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * CarouselView - A responsive, accessible carousel component
 *
 * Features:
 * - Swipe/drag support via Embla Carousel
 * - Keyboard navigation (Arrow keys, Enter, Space)
 * - Screen reader support with ARIA labels
 * - Lazy rendering for performance
 * - Responsive design
 * - Loop and autoplay options
 * - Custom item rendering
 * - Selection callbacks
 */
const CarouselView = React.forwardRef<
  HTMLDivElement,
  CarouselViewComponentProps
>(
  (
    {
      items,
      visibleCount,
      loop = false,
      autoplay = false,
      autoplayDelay = 3000,
      onItemSelect,
      renderItem,
      className,
      ...props
    },
    ref,
  ) => {
    const [api, setApi] = React.useState<CarouselApi>();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [selectedItem, setSelectedItem] = React.useState<
      CarouselViewPropsType["items"][0] | null
    >(null);
    const autoplayTimerRef = React.useRef<NodeJS.Timeout>();

    // Autoplay functionality
    React.useEffect(() => {
      if (!api || !autoplay) return;

      const startAutoplay = () => {
        autoplayTimerRef.current = setInterval(() => {
          if (api.canScrollNext()) {
            api.scrollNext();
          } else if (loop) {
            api.scrollTo(0);
          }
        }, autoplayDelay);
      };

      const stopAutoplay = () => {
        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current);
        }
      };

      startAutoplay();

      // Stop autoplay on user interaction
      const handleUserInteraction = () => {
        stopAutoplay();
        // Restart autoplay after a delay
        setTimeout(startAutoplay, autoplayDelay * 2);
      };

      api.on("pointerDown", handleUserInteraction);

      return () => {
        stopAutoplay();
        api.off("pointerDown", handleUserInteraction);
      };
    }, [api, autoplay, autoplayDelay, loop]);

    // Track current slide
    React.useEffect(() => {
      if (!api) return;

      const onSelect = () => {
        setCurrentIndex(api.selectedScrollSnap());
      };

      api.on("select", onSelect);
      onSelect(); // Set initial index

      return () => {
        api.off("select", onSelect);
      };
    }, [api]);

    // Navigation functions
    const navigateNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const navigatePrevious = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const navigateToIndex = React.useCallback(
      (index: number) => {
        if (index >= 0 && index < items.length) {
          api?.scrollTo(index);
        }
      },
      [api, items.length],
    );

    const selectItem = React.useCallback(
      (id: string) => {
        const item = items.find((item) => item.id === id);
        if (item) {
          setSelectedItem(item);
          onItemSelect?.(item);
        }
      },
      [items, onItemSelect],
    );

    const handleItemSelect = React.useCallback(
      (item: CarouselViewPropsType["items"][0]) => {
        setSelectedItem(item);
        onItemSelect?.(item);
      },
      [onItemSelect],
    );

    // Calculate responsive basis class
    const getBasisClass = () => {
      if (visibleCount) {
        return `basis-1/${visibleCount}`;
      }
      // Default responsive behavior
      return "md:basis-1/2 lg:basis-1/3";
    };

    const { addInteractableComponent, removeInteractableComponent } =
      useTamboInteractable();
    const componentIdRef = React.useRef<string | null>(null);

    // Navigation and selection handlers for intents
    const _handleNavigate = React.useCallback(
      (direction: "next" | "prev" | number) => {
        if (!api) return;

        if (typeof direction === "number") {
          api.scrollTo(direction);
        } else if (direction === "next") {
          api.scrollNext();
        } else if (direction === "prev") {
          api.scrollPrev();
        }
      },
      [api],
    );

    const _handleSelect = React.useCallback(
      (item: CarouselViewPropsType["items"][0]) => {
        setSelectedItem(item);
        onItemSelect?.(item);
      },
      [onItemSelect],
    );

    // Register component as interactable
    React.useEffect(() => {
      if (!addInteractableComponent) return;

      // Register the component as interactable
      const componentId = addInteractableComponent({
        name: "CarouselView",
        description:
          "An interactive carousel component that can display mixed media items with navigation and selection capabilities. AI can update props like items, visibleCount, loop, autoplay settings to control the carousel behavior.",
        component: CarouselView,
        props: {
          items,
          visibleCount,
          loop,
          autoplay,
          autoplayDelay,
          onItemSelect,
        },
        propsSchema: CarouselViewProps,
      });

      componentIdRef.current = componentId;

      // Cleanup function
      return () => {
        if (componentIdRef.current) {
          removeInteractableComponent(componentIdRef.current);
        }
      };
    }, [
      addInteractableComponent,
      removeInteractableComponent,
      items,
      visibleCount,
      loop,
      autoplay,
      autoplayDelay,
      onItemSelect,
    ]);

    const contextValue: CarouselViewContextValue = {
      api,
      currentIndex,
      itemCount: items.length,
      navigateNext,
      navigatePrevious,
      navigateToIndex,
      selectItem,
      selectedItem,
    };

    return (
      <CarouselViewContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("w-full", className)}
          role="region"
          aria-label="Carousel with navigation"
          {...props}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {items.map((item, index) => (
                <CarouselItem
                  key={item.id}
                  className={cn("pl-2 md:pl-4", getBasisClass())}
                  aria-label={`Slide ${index + 1} of ${items.length}`}
                >
                  {renderItem ? (
                    renderItem(item, index)
                  ) : (
                    <DefaultItemRenderer
                      item={item}
                      index={index}
                      onSelect={handleItemSelect}
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="-left-12"
              aria-label="Previous slide"
            />
            <CarouselNext className="-right-12" aria-label="Next slide" />
          </Carousel>

          {/* Slide indicators */}
          <div
            className="mt-4 flex justify-center space-x-2"
            role="tablist"
            aria-label="Carousel navigation"
          >
            {items.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted hover:bg-muted-foreground/50",
                )}
                onClick={() => navigateToIndex(index)}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Screen reader announcements */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Slide {currentIndex + 1} of {items.length}
            {selectedItem && `: Selected ${selectedItem.title}`}
          </div>
        </div>
      </CarouselViewContext.Provider>
    );
  },
);

CarouselView.displayName = "CarouselView";

export { CarouselView };
