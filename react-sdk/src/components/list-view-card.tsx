"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { z } from "zod";
import { cn } from "../util/cn";
import { useTamboComponentState } from "../hooks/use-component-state";

// Virtualization hook for efficient rendering of large lists
function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
    containerRef,
  };
}

// Zod schema for media items
const MediaSchema = z.object({
  type: z.enum(["avatar", "thumbnail", "icon"]),
  src: z.string(),
  alt: z.string().optional(),
});

// Zod schema for list items
const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  media: MediaSchema.optional(),
});

// Zod schema for component props
export const ListViewCardPropsSchema = z.object({
  items: z.array(ItemSchema).default([]),
  selectionMode: z.enum(["none", "single", "multi"]).default("none"),
  height: z.union([z.number(), z.string()]).default(400),
  itemHeight: z.number().default(60),
  showCheckboxes: z.boolean().default(false),
  onSelect: z.function().args(z.array(z.string())).returns(z.void()).optional(),
  onActivate: z.function().args(z.string()).returns(z.void()).optional(),
  onLoadMore: z
    .function()
    .args(z.object({ cursor: z.string().optional() }))
    .returns(z.promise(z.object({ items: z.array(ItemSchema), cursor: z.string().optional() })))
    .optional(),
  className: z.string().optional(),
  variant: z.enum(["default", "bordered", "elevated"]).default("default"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
});

// TypeScript types derived from the schema
export type ListViewCardProps = z.infer<typeof ListViewCardPropsSchema>;
export type ListViewCardItem = z.infer<typeof ItemSchema>;
export type ListViewCardMedia = z.infer<typeof MediaSchema>;

// Component state interface
interface ListViewCardState {
  selectedIds: string[];
  focusedIndex: number;
  searchQuery: string;
  isLoading: boolean;
  cursor?: string;
}

// Component ref interface
export interface ListViewCardRef {
  focusItem: (index: number) => void;
  scrollToItem: (index: number) => void;
  clearSelection: () => void;
  getSelectedItems: () => string[];
}

// Default state values
const defaultState: ListViewCardState = {
  selectedIds: [],
  focusedIndex: 0,
  searchQuery: "",
  isLoading: false,
  cursor: undefined,
};

// Size and variant configurations
const sizeConfigs = {
  sm: { padding: "px-3 py-2", text: "text-sm" },
  md: { padding: "px-4 py-3", text: "text-base" },
  lg: { padding: "px-6 py-4", text: "text-lg" },
};

const variantConfigs = {
  default: "bg-background border border-border",
  bordered: "bg-background border-2 border-border",
  elevated: "bg-background border border-border shadow-lg",
};

export const ListViewCard = forwardRef<ListViewCardRef, ListViewCardProps>(
  (
    {
      items = [],
      selectionMode = "none",
      height = 400,
      itemHeight = 60,
      showCheckboxes = false,
      onSelect,
      onActivate,
      onLoadMore,
      className,
      variant = "default",
      size = "md",
    },
    ref
  ) => {
    // Use Tambo component state management
    const [state, setState] = useTamboComponentState<ListViewCardState>(
      "list-view-card",
      defaultState
    );

    // Ensure state is always defined
    const currentState = state || defaultState;
    const { selectedIds, focusedIndex, searchQuery, isLoading, cursor } = currentState;

    // Virtualization setup
    const { visibleItems, offsetY, totalHeight, handleScroll, containerRef } =
      useVirtualization(items, itemHeight, typeof height === "number" ? height : 400);

    // Refs for imperative methods
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Memoized filtered items based on search query
    const filteredItems = useMemo(() => {
      if (!searchQuery.trim()) return items;
      const query = searchQuery.toLowerCase();
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query))
      );
    }, [items, searchQuery]);

    // Handle item selection
    const handleItemSelect = useCallback(
      (itemId: string, checked: boolean) => {
        if (selectionMode === "none") return;

        let newSelectedIds: string[];
        if (selectionMode === "single") {
          newSelectedIds = checked ? [itemId] : [];
        } else {
          // Multi-selection
          if (checked) {
            newSelectedIds = [...selectedIds, itemId];
          } else {
            newSelectedIds = selectedIds.filter((id) => id !== itemId);
          }
        }

        setState({
          ...currentState,
          selectedIds: newSelectedIds,
        });

        onSelect?.(newSelectedIds);
      },
      [selectionMode, selectedIds, onSelect, setState, currentState]
    );

    // Handle item activation
    const handleItemActivate = useCallback(
      (itemId: string) => {
        onActivate?.(itemId);
      },
      [onActivate]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!filteredItems.length) return;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setState({
              ...currentState,
              focusedIndex: Math.min(focusedIndex + 1, filteredItems.length - 1),
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setState({
              ...currentState,
              focusedIndex: Math.max(focusedIndex - 1, 0),
            });
            break;
          case "Home":
            e.preventDefault();
            setState({
              ...currentState,
              focusedIndex: 0,
            });
            break;
          case "End":
            e.preventDefault();
            setState({
              ...currentState,
              focusedIndex: filteredItems.length - 1,
            });
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (filteredItems[focusedIndex]) {
              handleItemActivate(filteredItems[focusedIndex].id);
            }
            break;
          default:
            // Type-ahead search
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
              const newQuery = searchQuery + e.key.toLowerCase();
              setState({
                ...currentState,
                searchQuery: newQuery,
              });
            }
            break;
        }
      },
      [filteredItems, focusedIndex, searchQuery, handleItemActivate, setState, currentState]
    );

    // Handle load more
    const handleLoadMore = useCallback(async () => {
      if (!onLoadMore || isLoading) return;

      setState({
        ...currentState,
        isLoading: true,
      });

      try {
        const result = await onLoadMore({ cursor });
        setState({
          ...currentState,
          isLoading: false,
          cursor: result.cursor,
        });
      } catch (error) {
        setState({
          ...currentState,
          isLoading: false,
        });
        console.error("Error loading more items:", error);
      }
    }, [onLoadMore, isLoading, cursor, setState, currentState]);

    // Imperative methods
    useImperativeHandle(
      ref,
      () => ({
        focusItem: (index: number) => {
          const item = itemRefs.current.get(index);
          if (item) {
            item.focus();
            setState({
              ...currentState,
              focusedIndex: index,
            });
          }
        },
        scrollToItem: (index: number) => {
          if (listRef.current) {
            const scrollTop = index * itemHeight;
            listRef.current.scrollTop = scrollTop;
          }
        },
        clearSelection: () => {
          setState({
            ...currentState,
            selectedIds: [],
          });
          onSelect?.([]);
        },
        getSelectedItems: () => selectedIds,
      }),
      [itemHeight, onSelect, setState, currentState, selectedIds]
    );

    // Auto-focus first item on mount
    useEffect(() => {
      if (filteredItems.length > 0 && focusedIndex >= filteredItems.length) {
        setState({
          ...currentState,
          focusedIndex: 0,
        });
      }
    }, [filteredItems.length, focusedIndex, setState, currentState]);

    // Handle scroll to bottom for load more
    useEffect(() => {
      if (!onLoadMore || !containerRef.current) return;

      const container = containerRef.current;
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          handleLoadMore();
        }
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, [onLoadMore, handleLoadMore]);

    // Render media item
    const renderMedia = (media: ListViewCardMedia) => {
      switch (media.type) {
        case "avatar":
          return (
            <img
              src={media.src}
              alt={media.alt || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
          );
        case "thumbnail":
          return (
            <img
              src={media.src}
              alt={media.alt || ""}
              className="w-10 h-10 rounded object-cover"
            />
          );
        case "icon":
          return (
            <span className="w-10 h-10 flex items-center justify-center text-2xl">
              {media.src}
            </span>
          );
        default:
          return null;
      }
    };

    // Render selection control
    const renderSelectionControl = (item: ListViewCardItem) => {
      if (selectionMode === "none") return null;

      const isSelected = selectedIds.includes(item.id);

      if (selectionMode === "single") {
        return (
          <input
            type="radio"
            name="list-selection"
            checked={isSelected}
            onChange={(e) => handleItemSelect(item.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        );
      }

      if (selectionMode === "multi" && showCheckboxes) {
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleItemSelect(item.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        );
      }

      return null;
    };

    if (filteredItems.length === 0) {
      return (
        <div
          className={cn(
            "flex items-center justify-center p-8 text-muted-foreground",
            variantConfigs[variant],
            "rounded-lg",
            className
          )}
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
          {searchQuery ? "No items match your search." : "No items to display."}
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className={cn(
          "relative",
          variantConfigs[variant],
          "rounded-lg overflow-hidden",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div
          ref={containerRef}
          className="overflow-auto h-full"
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="listbox"
          aria-label="List of items"
          aria-multiselectable={selectionMode === "multi"}
          aria-activedescendant={`item-${focusedIndex}`}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((item, index) => {
                const actualIndex = filteredItems.findIndex((i) => i.id === item.id);
                const isFocused = actualIndex === focusedIndex;
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(actualIndex, el);
                    }}
                    id={`item-${actualIndex}`}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer transition-colors",
                      sizeConfigs[size].padding,
                      sizeConfigs[size].text,
                      isFocused && "bg-accent",
                      isSelected && "bg-primary/10",
                      "hover:bg-accent/50",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    tabIndex={-1}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleItemActivate(item.id)}
                    onFocus={() =>
                      setState({
                        ...currentState,
                        focusedIndex: actualIndex,
                      })
                    }
                  >
                    {renderSelectionControl(item)}
                    {item.media && renderMedia(item.media)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Load more indicator */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 text-center text-sm text-muted-foreground">
            Loading more items...
          </div>
        )}
      </div>
    );
  }
);

ListViewCard.displayName = "ListViewCard";
