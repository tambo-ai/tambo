"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useId } from "react";
import { useSwipeable } from "react-swipeable";
import { z } from "zod";
import { CarouselItem } from "./CarouselItem";
import { CarouselControls } from "./CarouselControls";
import { CarouselIndicators } from "./CarouselIndicators";

export const carouselDataSchema = z.object({
  items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      description: z.string().optional(),
      media: z.string().optional(),
      mediaType: z.enum(["image", "video"]).optional(),
    }),
  ),
});

export const carouselSchema = z.object({
  data: carouselDataSchema,
  title: z.string().optional(),
  visibleCount: z.number().int().min(1).optional().default(1),
  loop: z.boolean().optional().default(false),
  autoplay: z
    .union([z.boolean(), z.number().int().min(1000)])
    .optional()
    .default(false),
  showControls: z.boolean().optional().default(true),
  showIndicators: z.boolean().optional().default(true),
  variant: z.enum(["default", "solid", "bordered"]).optional(),
  size: z
    .enum([
      "xs",
      "extra-small",
      "sm",
      "small",
      "md",
      "medium",
      "lg",
      "large",
      "xl",
      "extra-large",
      "xxl",
    ])
    .optional(),
  width: z.enum(["default", "sm", "md", "lg", "xl", "xxl"]).optional(),
});

export type CarouselDataType = z.infer<typeof carouselDataSchema>;

type AbbreviatedSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export type CarouselProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "data" | "title" | "size"
> &
  VariantProps<typeof carouselVariants> & {
    width?: "default" | "sm" | "md" | "lg";
    size?: z.infer<typeof carouselSchema>["size"];
    data?: CarouselDataType;
    title?: string;
    visibleCount?: number;
    loop?: boolean;
    autoplay?: boolean | number;
    showControls?: boolean;
    showIndicators?: boolean;
    onNavigate?: (direction: "next" | "prev" | number) => void;
    onSelect?: (id: string | number) => void;
  };

// ... (variants and isVideo function remain the same)
const carouselVariants = cva(
  "rounded-lg overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background",
        solid: "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20 bg-muted",
        bordered: "border-2 border-border",
      },
      size: {
        xs: "h-[40vh]",
        sm: "h-[50vh]",
        md: "h-[60vh]",
        lg: "h-[70vh]",
        xl: "h-[80vh]",
        xxl: "h-[90vh]",
      },
      width: {
        default: "w-full",
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        xxl: "max-w-7xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      width: "default",
    },
  },
);

interface CarouselState {
  currentIndex: number;
  isAnimating: boolean;
  hasTransition: boolean;
  selectedId: string | number | null;
  isPaused: boolean;
  announcement: string;
  isDragging: boolean;
  dragOffset: number;
  focusRequested: boolean;
}

type CarouselAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GOTO"; payload: number }
  | { type: "DRAG_START" }
  | { type: "DRAG_MOVE"; payload: number }
  | { type: "DRAG_END" }
  | { type: "ANIMATION_START" }
  | { type: "ANIMATION_END" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SELECT"; payload: { id: string | number; title: string } }
  | { type: "ANNOUNCE"; payload: string }
  | { type: "JUMP"; index: number; reenableTransition?: boolean }
  | { type: "ENABLE_TRANSITION" }
  | { type: "FOCUS_REQUEST" };

function carouselReducer(
  state: CarouselState,
  action: CarouselAction,
): CarouselState {
  switch (action.type) {
    case "NEXT":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isAnimating: true,
        dragOffset: 0,
      };
    case "PREV":
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        isAnimating: true,
        dragOffset: 0,
      };
    case "GOTO":
      return { ...state, currentIndex: action.payload, isAnimating: true };
    case "JUMP":
      return {
        ...state,
        currentIndex: action.index,
        hasTransition: !!action.reenableTransition,
        isAnimating: false,
        dragOffset: 0,
      };
    case "ENABLE_TRANSITION":
      return { ...state, hasTransition: true };
    case "FOCUS_REQUEST":
      return { ...state, focusRequested: true };
    case "DRAG_START":
      return { ...state, isDragging: true };
    case "DRAG_MOVE":
      return { ...state, dragOffset: action.payload };
    case "DRAG_END":
      return { ...state, isDragging: false, dragOffset: 0 };
    case "ANIMATION_START":
      return { ...state, isAnimating: true };
    case "ANIMATION_END":
      return { ...state, isAnimating: false };
    case "PAUSE":
      return { ...state, isPaused: true };
    case "RESUME":
      return { ...state, isPaused: false };
    case "SELECT":
      return {
        ...state,
        selectedId: action.payload.id,
        announcement: `${action.payload.title} selected`,
      };
    case "ANNOUNCE":
      return { ...state, announcement: action.payload };
    default:
      return state;
  }
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      className,
      variant,
      size,
      width,
      data,
      title,
      visibleCount = 1,
      loop = false,
      autoplay = false,
      showControls = true,
      showIndicators = true,
      onNavigate,
      onSelect,
      ...props
    },
    ref,
  ) => {
    const items = data?.items || [];
    const totalItems = items.length;
    const transitionDuration = 300;

    const initialState: CarouselState = {
      currentIndex: loop && totalItems > visibleCount ? visibleCount : 0,
      isAnimating: false,
      hasTransition: true,
      selectedId: null,
      isPaused: false,
      announcement: "",
      isDragging: false,
      dragOffset: 0,
      focusRequested: false,
    };

    const [state, dispatch] = React.useReducer(carouselReducer, initialState);
    const {
      currentIndex,
      isAnimating,
      hasTransition,
      selectedId,
      isPaused,
      announcement,
      isDragging,
      dragOffset,
    } = state;

    const slideContainerId = useId();
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(
      ref,
      () => containerRef.current as HTMLDivElement,
    );

    const normalizedSize: AbbreviatedSize = React.useMemo(() => {
      const sizeMap: Record<string, AbbreviatedSize> = {
        "extra-small": "xs",
        small: "sm",
        medium: "md",
        large: "lg",
        "extra-large": "xl",
        "extra-extra-large": "xxl",
      };
      if (size && size in sizeMap) return sizeMap[size];
      if (size && ["xs", "sm", "md", "lg", "xl", "xxl"].includes(size))
        return size as AbbreviatedSize;
      return "md";
    }, [size]);

    const clonedItems = React.useMemo(() => {
      if (loop && totalItems > visibleCount) {
        const startClones = items.slice(totalItems - visibleCount);
        const endClones = items.slice(0, visibleCount);
        return [...startClones, ...items, ...endClones];
      }
      return items;
    }, [items, loop, visibleCount, totalItems]);

    const totalPages = Math.ceil(totalItems / visibleCount);
    const realCurrentPage = loop
      ? Math.floor(
          ((currentIndex - visibleCount + totalItems) % totalItems) /
            visibleCount,
        )
      : Math.floor(currentIndex / visibleCount);

    React.useEffect(() => {
      if (totalItems > 0) {
        dispatch({
          type: "ANNOUNCE",
          payload: `Slide ${realCurrentPage + 1} of ${totalPages}`,
        });
      }
    }, [realCurrentPage, totalPages, totalItems]);

    const next = React.useCallback(() => {
      if (isAnimating) return;
      if (loop || currentIndex < totalPages - 1) {
        dispatch({ type: "NEXT" });
        onNavigate?.("next");
      }
    }, [isAnimating, loop, currentIndex, totalPages, onNavigate]);

    const prev = React.useCallback(() => {
      if (isAnimating) return;
      if (loop || currentIndex > 0) {
        dispatch({ type: "PREV" });
        onNavigate?.("prev");
      }
    }, [isAnimating, loop, currentIndex, onNavigate]);

    const goToIndex = (index: number) => {
      if (isAnimating) return;
      const newIndex = loop ? index + visibleCount : index;
      dispatch({ type: "GOTO", payload: newIndex });
      onNavigate?.(index);
    };

    React.useEffect(() => {
      if (!isAnimating) return;
      const t = setTimeout(
        () => dispatch({ type: "ANIMATION_END" }),
        transitionDuration,
      );
      return () => clearTimeout(t);
    }, [isAnimating]);

    React.useEffect(() => {
      if (
        loop &&
        (currentIndex === 0 || currentIndex === totalItems + visibleCount)
      ) {
        const t = setTimeout(() => {
          const targetIndex = currentIndex === 0 ? totalItems : visibleCount;
          dispatch({ type: "JUMP", index: targetIndex });
          setTimeout(() => dispatch({ type: "ENABLE_TRANSITION" }), 50);
        }, transitionDuration);
        return () => clearTimeout(t);
      }
    }, [currentIndex, loop, totalItems, visibleCount]);

    React.useEffect(() => {
      if (autoplay && !isPaused) {
        const interval = typeof autoplay === "number" ? autoplay : 3000;
        const timer = setInterval(() => next(), interval);
        return () => clearInterval(timer);
      }
    }, [autoplay, isPaused, next, currentIndex]);

    React.useEffect(() => {
      if (state.focusRequested && containerRef.current) {
        containerRef.current.focus({ preventScroll: true });

        state.focusRequested = false;
      }
    }, [currentIndex, state.focusRequested]);

    const swipeHandlers = useSwipeable({
      onSwiping: (e) => {
        if (isAnimating) return;
        dispatch({ type: "DRAG_START" });
        dispatch({ type: "DRAG_MOVE", payload: e.deltaX });
      },
      onSwiped: (e) => {
        dispatch({ type: "DRAG_END" });
        if (e.dir === "Left") next();
        else if (e.dir === "Right") prev();
        else dispatch({ type: "DRAG_MOVE", payload: 0 });
      },
      trackMouse: true,
      preventScrollOnSwipe: true,
      delta: 50,
    });

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prev();
        dispatch({ type: "FOCUS_REQUEST" });
      } else if (event.key === "ArrowRight") {
        next();
        dispatch({ type: "FOCUS_REQUEST" });
      }
    };

    const BUFFER_PAGES = 1;

    const slidesToRenderRange = React.useMemo(() => {
      const start = Math.max(
        0,
        currentIndex - visibleCount * (BUFFER_PAGES + 1),
      );
      const end = Math.min(
        clonedItems.length - 1,
        currentIndex + visibleCount * (BUFFER_PAGES + 1),
      );
      return { start, end };
    }, [currentIndex, visibleCount, clonedItems.length]);

    if (items.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            carouselVariants({ variant, size: normalizedSize, width }),
            className,
          )}
          {...props}
        >
          <div className="p-4 h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Awaiting data...</p>
          </div>
        </div>
      );
    }

    const isPrevDisabled = (!loop && currentIndex === 0) || isAnimating;
    const isNextDisabled =
      (!loop && currentIndex === totalPages - 1) || isAnimating;

    return (
      <div
        ref={containerRef}
        role="application"
        aria-roledescription="carousel"
        aria-label={title || "Carousel"}
        className={cn(
          carouselVariants({ variant, size: normalizedSize, width }),
          className,
        )}
        onMouseEnter={() => dispatch({ type: "PAUSE" })}
        onMouseLeave={() => dispatch({ type: "RESUME" })}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        {...props}
      >
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <div className="p-4 h-full flex flex-col">
          {title && (
            <h3 className="text-lg font-medium mb-4 text-foreground">
              {title}
            </h3>
          )}

          <div className="w-full h-[calc(100%-2rem)] flex flex-col">
            <div
              id={slideContainerId}
              className={cn(
                "relative flex-1 overflow-hidden",
                isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              {...swipeHandlers}
            >
              <div
                className="flex h-full gap-4"
                style={{
                  transform: `translateX(calc(-${(currentIndex * 100) / visibleCount}% - ${currentIndex * 1}rem + ${dragOffset}px))`,
                  transition: isDragging
                    ? "none"
                    : hasTransition
                      ? `transform ${transitionDuration}ms ease-in-out`
                      : "none",
                }}
              >
                {clonedItems.map((item, index) => {
                  if (
                    index < slidesToRenderRange.start ||
                    index > slidesToRenderRange.end
                  ) {
                    // render a lightweight placeholder (keeps sizing)
                    return (
                      <div
                        key={`placeholder-${index}`}
                        style={{
                          flexShrink: 0,
                          width: `calc((100% - ((${visibleCount} - 1) * 1rem)) / ${visibleCount})`,
                        }}
                        aria-hidden="true"
                      />
                    );
                  }

                  return (
                    <CarouselItem
                      key={`${item.id}-${index}`}
                      item={item}
                      size={normalizedSize}
                      isSelected={selectedId === item.id}
                      onClick={() => {
                        dispatch({
                          type: "SELECT",
                          payload: { id: item.id, title: item.title },
                        });
                        onSelect?.(item.id);
                      }}
                      visibleCount={visibleCount}
                    />
                  );
                })}
              </div>
            </div>

            {showControls && totalItems > visibleCount && (
              <CarouselControls
                onPrev={prev}
                onNext={next}
                isPrevDisabled={isPrevDisabled}
                isNextDisabled={isNextDisabled}
                slideContainerId={slideContainerId}
              />
            )}

            {showIndicators && totalItems > visibleCount && (
              <CarouselIndicators
                totalPages={totalPages}
                currentPage={realCurrentPage}
                onGoToIndex={goToIndex}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

Carousel.displayName = "Carousel";
