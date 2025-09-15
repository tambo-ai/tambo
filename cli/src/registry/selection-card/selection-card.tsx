"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import { Check, CheckSquare, Minus, Square } from "lucide-react";
import * as React from "react";
import { z } from "zod";

/**
 * Zod schema for SelectionCard props
 */
export const selectionCardPropsSchema = z.object({
  /** Selection mode - single or multi */
  mode: z
    .enum(["single", "multi"])
    .optional()
    .describe(
      "Selection mode - single allows one selection, multi allows multiple selections",
    ),
  /** Array of currently selected item IDs (controlled mode) */
  selectedIds: z
    .array(z.string())
    .optional()
    .describe("Array of currently selected item IDs (controlled mode)"),
  /** Default selected item IDs (uncontrolled mode) */
  defaultSelectedIds: z
    .array(z.string())
    .optional()
    .describe("Default selected item IDs for uncontrolled mode"),
  /** Total count of items available (defaults to items.length, useful for pagination) */
  totalCount: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Total count of items available (defaults to items.length, useful for pagination)",
    ),
  /** Array of item IDs that should be disabled */
  disabledIds: z
    .array(z.string())
    .optional()
    .describe("Array of item IDs that should be disabled and non-selectable"),
  /** Items to display - can be strings or objects with id and label */
  items: z
    .array(
      z.union([
        z.string(),
        z.object({
          id: z.string().describe("Unique identifier for the item"),
          label: z.string().describe("Display text for the item"),
          disabled: z
            .boolean()
            .optional()
            .describe("Whether this specific item is disabled"),
        }),
      ]),
    )
    .optional()
    .describe(
      "Items to display - can be simple strings or objects with id, label, and disabled properties",
    ),
  /** Selection change handler (optional - component works independently without it) */
  onChange: z
    .function()
    .args(z.array(z.string()))
    .returns(z.void())
    .optional()
    .describe("Callback function called when selection changes"),
  /** Custom class name */
  className: z
    .string()
    .optional()
    .describe("Additional CSS classes for custom styling"),
});

export interface SelectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Selection mode - single or multi */
  mode?: "single" | "multi";
  /** Array of currently selected item IDs (controlled mode) */
  selectedIds?: string[];
  /** Default selected item IDs (uncontrolled mode) */
  defaultSelectedIds?: string[];
  /** Total count of items available (defaults to items.length, useful for pagination) */
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
  /** Selection change handler (optional - component works independently without it) */
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
 * A generic selection controller component for handling single and multi-select scenarios.
 * Flexible selection component that works independently or with external state management.
 * @component
 * @example
 * ```tsx
 * // Works without external state management
 * <SelectionCard
 *   mode="multi"
 *   items={["Apple", "Banana", "Cherry", "Date", "Elderberry"]}
 * />
 *
 * // Single selection mode
 * <SelectionCard
 *   mode="single"
 *   items={["Small", "Medium", "Large", "Extra Large"]}
 * />
 *
 * // With default selections
 * <SelectionCard
 *   mode="multi"
 *   defaultSelectedIds={["item1", "item3"]}
 *   items={["item1", "item2", "item3", "item4", "item5"]}
 * />
 *
 * // Controlled mode (advanced usage)
 * <SelectionCard
 *   mode="multi"
 *   selectedIds={selectedItems}
 *   items={["item1", "item2", "item3"]}
 *   onChange={(selectedIds) => setSelectedItems(selectedIds)}
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
      selectedIds,
      defaultSelectedIds = [],
      totalCount,
      disabledIds = [],
      items = [],
      onChange,
      className,
      ...props
    },
    ref,
  ) => {
    // Determine mode: controlled (selectedIds + onChange), semi-controlled (selectedIds only), or independent
    const isControlled = selectedIds !== undefined && onChange !== undefined;

    // Internal state for independent and semi-controlled modes using Tambo state management
    // This allows AI to understand and interact with the selection state
    const [internalSelectedIds, setInternalSelectedIds] =
      useTamboComponentState("selectedItems", defaultSelectedIds);

    // Handle streaming updates from defaultSelectedIds
    React.useEffect(() => {
      if (defaultSelectedIds.length > 0 && !internalSelectedIds?.length) {
        setInternalSelectedIds(defaultSelectedIds);
      }
    }, [defaultSelectedIds, internalSelectedIds, setInternalSelectedIds]);

    // State for collapsed/expanded view (show only 5 items initially)
    const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

    // Use controlled value or internal state, with fallback to empty array
    const currentSelectedIds = React.useMemo(() => {
      return isControlled ? selectedIds : (internalSelectedIds ?? []);
    }, [isControlled, selectedIds, internalSelectedIds]);

    // Handler that works for all modes
    const handleSelectionChange = React.useCallback(
      (newSelectedIds: string[]) => {
        // Always update internal state for independent/semi-controlled modes
        if (!isControlled) {
          setInternalSelectedIds(newSelectedIds);
        }

        // Only call onChange if provided (for controlled and semi-controlled modes)
        onChange?.(newSelectedIds);
      },
      [isControlled, onChange, setInternalSelectedIds],
    );
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

    // Determine items to display (limit to 5 unless expanded)
    const ITEMS_LIMIT = 5;
    const hasMoreItems = normalizedItems.length > ITEMS_LIMIT;
    const displayedItems = React.useMemo(() => {
      if (!hasMoreItems || isExpanded) {
        return normalizedItems;
      }
      return normalizedItems.slice(0, ITEMS_LIMIT);
    }, [normalizedItems, isExpanded, hasMoreItems]);

    // Calculate actual total count (inferred from items.length unless explicitly provided)
    const actualTotalCount = totalCount ?? normalizedItems.length;

    // Calculate selection state
    const selectionState = React.useMemo(() => {
      const selectedCount = currentSelectedIds.length;
      const enabledCount = normalizedItems.filter(
        (item) => !item.disabled,
      ).length;
      const selectableTotal =
        actualTotalCount > 0 ? actualTotalCount : enabledCount;

      if (selectedCount === 0) return "none";
      if (selectedCount === selectableTotal) return "all";
      return "some";
    }, [currentSelectedIds.length, actualTotalCount, normalizedItems]);

    // Handle item selection/deselection
    const handleItemToggle = React.useCallback(
      (itemId: string) => {
        if (disabledIds.includes(itemId)) return;

        let newSelectedIds: string[];

        if (mode === "single") {
          newSelectedIds = currentSelectedIds.includes(itemId) ? [] : [itemId];
        } else {
          newSelectedIds = currentSelectedIds.includes(itemId)
            ? currentSelectedIds.filter((id) => id !== itemId)
            : [...currentSelectedIds, itemId];
        }

        handleSelectionChange(newSelectedIds);
      },
      [mode, currentSelectedIds, disabledIds, handleSelectionChange],
    );

    // Selection intents for programmatic control
    const intents: SelectionIntents = React.useMemo(
      () => ({
        select: (ids: string[]) => {
          const validIds = ids.filter((id) => !disabledIds.includes(id));
          if (mode === "single") {
            handleSelectionChange(validIds.slice(0, 1));
          } else {
            const newIds = [...new Set([...currentSelectedIds, ...validIds])];
            handleSelectionChange(newIds);
          }
        },
        deselect: (ids: string[]) => {
          const newIds = currentSelectedIds.filter((id) => !ids.includes(id));
          handleSelectionChange(newIds);
        },
        selectAll: () => {
          if (mode === "multi") {
            const allEnabledIds = normalizedItems
              .filter((item) => !item.disabled)
              .map((item) => item.id);
            handleSelectionChange(allEnabledIds);
          }
        },
        clear: () => {
          handleSelectionChange([]);
        },
      }),
      [
        mode,
        currentSelectedIds,
        disabledIds,
        normalizedItems,
        handleSelectionChange,
      ],
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
            Select all ({currentSelectedIds.length}/
            {Math.max(
              actualTotalCount,
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
          <div>
            <div className="divide-y">
              {displayedItems.map((item) => {
                const isSelected = currentSelectedIds.includes(item.id);
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

            {hasMoreItems && (
              <div className="border-t p-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  type="button"
                >
                  {isExpanded
                    ? `Show less (${displayedItems.length}/${normalizedItems.length})`
                    : `Show ${normalizedItems.length - ITEMS_LIMIT} more items`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No items to display</p>
            {actualTotalCount > normalizedItems.length && (
              <p className="text-xs mt-1">
                Total available: {actualTotalCount}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

SelectionCard.displayName = "SelectionCard";
