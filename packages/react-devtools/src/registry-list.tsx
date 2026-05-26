"use client";
import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { KeyboardEvent } from "react";
import type { getStyles } from "./styles";

interface RegistryItem {
  name: string;
  description?: string;
  schema?: unknown;
  secondarySchema?: unknown;
  schemaLabel?: string;
  secondarySchemaLabel?: string;
  associatedTools?: readonly string[];
}

interface RegistryListProps {
  items: RegistryItem[];
  selectedItem: string | null;
  onSelect: (name: string) => void;
  emptyMessage: string;
  styles: ReturnType<typeof getStyles>;
}

export interface RegistryListHandle {
  focus: () => void;
}

/**
 * Compact sidebar list of registry items with keyboard navigation.
 * ArrowUp/ArrowDown moves focus through items, Enter selects.
 * Focus styling is handled by CSS :focus-visible.
 * @param props - Items, selection state, handler, and styles
 * @returns Sidebar list or empty state
 */
export const RegistryList = forwardRef<RegistryListHandle, RegistryListProps>(
  ({ items, selectedItem, onSelect, emptyMessage, styles }, ref) => {
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const setItemRef = useCallback(
      (name: string, el: HTMLDivElement | null) => {
        if (el) {
          itemRefs.current.set(name, el);
        } else {
          itemRefs.current.delete(name);
        }
      },
      [],
    );

    const focusItemByIndex = useCallback(
      (index: number) => {
        const item = items[index];
        if (!item) {
          return;
        }
        itemRefs.current.get(item.name)?.focus();
      },
      [items],
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          if (items.length === 0) {
            return;
          }
          const targetIndex = selectedItem
            ? items.findIndex((i) => i.name === selectedItem)
            : 0;
          focusItemByIndex(targetIndex === -1 ? 0 : targetIndex);
        },
      }),
      [items, selectedItem, focusItemByIndex],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (index < items.length - 1) {
          focusItemByIndex(index + 1);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (index > 0) {
          focusItemByIndex(index - 1);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(items[index].name);
      }
    };

    if (items.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateHeading}>{emptyMessage}</div>
        </div>
      );
    }

    return (
      <div role="listbox" aria-label="Registry items">
        {items.map((item, index) => {
          const isSelected = item.name === selectedItem;
          return (
            <div
              key={item.name}
              ref={(el) => setItemRef(item.name, el)}
              role="option"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              style={{
                ...styles.sidebarItem,
                ...(isSelected ? styles.sidebarItemActive : {}),
              }}
              onClick={() => onSelect(item.name)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {item.name}
            </div>
          );
        })}
      </div>
    );
  },
);

RegistryList.displayName = "RegistryList";
