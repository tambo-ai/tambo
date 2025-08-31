"use client";

import { cn } from "@/lib/utils";
import { Check, CheckSquare, Minus, Square } from "lucide-react";
import * as React from "react";
import { z } from "zod";

/**
 * Zod schema for SelectionCard props
 */
export const selectionCardPropsSchema = z.object({
  /** Selection mode - single or multi */
  mode: z.enum(["single", "multi"]).optional(),
  /** Array of currently selected item IDs */
  selectedIds: z.array(z.string()).optional(),
  /** Total count of items available for selection */
  totalCount: z.number().min(0).optional(),
  /** Array of item IDs that should be disabled */
  disabledIds: z.array(z.string()).optional(),
  /** Items to display - can be strings or objects with id and label */
  items: z
    .array(
      z.union([
        z.string(),
        z.object({
          id: z.string(),
          label: z.string(),
          disabled: z.boolean().optional(),
        }),
      ]),
    )
    .optional(),
  /** Selection change handler */
  onChange: z.function().args(z.array(z.string())).returns(z.void()).optional(),
  /** Custom class name */
  className: z.string().optional(),
});

export interface SelectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Selection mode - single or multi */
  mode?: "single" | "multi";
  /** Array of currently selected item IDs */
  selectedIds?: string[];
  /** Total count of items available for selection */
  totalCount?: number;
  /** Array of item IDs that should be disabled */
  disabledIds?: string[];
  /** Items to display - can be strings or objects with id and label */
  items?: (
    | string
    | {
        id: string;
        label: string;
        disabled?: boolean;
      }
  )[];
  /** Selection change handler */
  onChange?: (selectedIds: string[]) => void;
}

/**
 * Selection intents for programmatic control
 */
export interface SelectionIntents {
  /** Select specific items by their IDs */
  select: (ids: string[]) => void;
  /** Deselect specific items by their IDs */
  deselect: (ids: string[]) => void;
  /** Select all available items */
  selectAll: () => void;
  /** Clear all selections */
  clear: () => void;
}

/**
 * A generic selection controller component for handling single and multi-select scenarios
 * @component
 * @example
 * ```tsx
 * <SelectionCard
 *   mode="multi"
 *   selectedIds={["item1", "item3"]}
 *   totalCount={5}
 *   items={["item1", "item2", "item3", "item4", "item5"]}
 *   onChange={(selectedIds) => console.log(selectedIds)}
 * />
 * ```
 */
export const SelectionCard = React.forwardRef<
  HTMLDivElement,
  SelectionCardProps
>(
  (
    {
      mode = "single",
      selectedIds = [],
      totalCount = 0,
      disabledIds = [],
      items = [],
      onChange,
      className,
      ...props
    },
    ref,
  ) => {
    // Convert items to normalized format
    const normalizedItems = React.useMemo(() => {
      return items.map((item) => {
        if (typeof item === "string") {
          return {
            id: item,
            label: item,
            disabled: disabledIds.includes(item),
          };
        }
        return {
          ...item,
          disabled: item.disabled ?? disabledIds.includes(item.id),
        };
      });
    }, [items, disabledIds]);

    // Calculate selection state
    const selectionState = React.useMemo(() => {
      const selectedCount = selectedIds.length;
      const totalSelectableCount = Math.max(totalCount, normalizedItems.length);
      const enabledCount = normalizedItems.filter(
        (item) => !item.disabled,
      ).length;
      const actualTotal =
        totalSelectableCount > 0 ? totalSelectableCount : enabledCount;

      if (selectedCount === 0) return "none";
      if (selectedCount === actualTotal) return "all";
      return "some";
    }, [selectedIds.length, totalCount, normalizedItems]);

    // Handle item selection/deselection
    const handleItemToggle = React.useCallback(
      (itemId: string) => {
        if (disabledIds.includes(itemId)) return;

        let newSelectedIds: string[];

        if (mode === "single") {
          newSelectedIds = selectedIds.includes(itemId) ? [] : [itemId];
        } else {
          newSelectedIds = selectedIds.includes(itemId)
            ? selectedIds.filter((id) => id !== itemId)
            : [...selectedIds, itemId];
        }

        onChange?.(newSelectedIds);
      },
      [mode, selectedIds, disabledIds, onChange],
    );

    // Selection intents for programmatic control
    const intents: SelectionIntents = React.useMemo(
      () => ({
        select: (ids: string[]) => {
          const validIds = ids.filter((id) => !disabledIds.includes(id));
          if (mode === "single") {
            onChange?.(validIds.slice(0, 1));
          } else {
            const newIds = [...new Set([...selectedIds, ...validIds])];
            onChange?.(newIds);
          }
        },
        deselect: (ids: string[]) => {
          const newIds = selectedIds.filter((id) => !ids.includes(id));
          onChange?.(newIds);
        },
        selectAll: () => {
          if (mode === "multi") {
            const allEnabledIds = normalizedItems
              .filter((item) => !item.disabled)
              .map((item) => item.id);
            onChange?.(allEnabledIds);
          }
        },
        clear: () => {
          onChange?.([]);
        },
      }),
      [mode, selectedIds, disabledIds, normalizedItems, onChange],
    );

    // Keyboard event handler
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (mode === "multi" && (e.metaKey || e.ctrlKey)) {
          if (e.key === "a") {
            e.preventDefault();
            intents.selectAll();
          }
        }
        if (e.key === "Escape") {
          intents.clear();
        }
      },
      [mode, intents],
    );

    // Header selection control for multi-select
    const renderHeaderControl = () => {
      if (mode === "single" || normalizedItems.length === 0) return null;

      const handleHeaderClick = () => {
        if (selectionState === "all" || selectionState === "some") {
          intents.clear();
        } else {
          intents.selectAll();
        }
      };

      return (
        <div
          className="flex items-center gap-2 p-3 border-b cursor-pointer hover:bg-gray-50"
          onClick={handleHeaderClick}
          role="button"
          tabIndex={0}
          aria-label={`${selectionState === "all" ? "Deselect all" : "Select all"} items`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleHeaderClick();
            }
          }}
        >
          <div className="flex items-center justify-center w-4 h-4">
            {selectionState === "all" && (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            )}
            {selectionState === "some" && (
              <Minus className="w-4 h-4 text-blue-600" />
            )}
            {selectionState === "none" && (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <span className="text-sm font-medium">
            Select all ({selectedIds.length}/
            {Math.max(
              totalCount,
              normalizedItems.filter((item) => !item.disabled).length,
            )}
            )
          </span>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("border rounded-lg bg-white shadow-sm", className)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role={mode === "multi" ? "listbox" : "radiogroup"}
        aria-multiselectable={mode === "multi"}
        aria-label="Selection control"
        {...props}
      >
        {renderHeaderControl()}

        {normalizedItems.length > 0 ? (
          <div className="divide-y">
            {normalizedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isDisabled = item.disabled;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                    isSelected && "bg-blue-50",
                    isDisabled &&
                      "opacity-50 cursor-not-allowed hover:bg-transparent",
                  )}
                  onClick={() => !isDisabled && handleItemToggle(item.id)}
                  role={mode === "multi" ? "option" : "radio"}
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!isDisabled) handleItemToggle(item.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-center w-4 h-4">
                    {mode === "multi" ? (
                      isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )
                    ) : (
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          isSelected
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300",
                        )}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No items to display</p>
            {totalCount > 0 && (
              <p className="text-xs mt-1">Total count: {totalCount}</p>
            )}
          </div>
        )}
      </div>
    );
  },
);

SelectionCard.displayName = "SelectionCard";

// SelectionIntents type is already exported above
