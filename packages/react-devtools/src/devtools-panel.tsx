"use client";
import type { DevtoolsEvent } from "@tambo-ai/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DetailView } from "./detail-view";
import { RegistryList } from "./registry-list";
import type { RegistryListHandle } from "./registry-list";
import { SearchFilter } from "./search-filter";
import { getStyles } from "./styles";
import { TimelineView } from "./timeline-view";
import type { Tab, UsePanelStateReturn } from "./use-panel-state";
import { useResize } from "./use-resize";

interface RegistryItem {
  name: string;
  description?: string;
  schema?: unknown;
  secondarySchema?: unknown;
  schemaLabel?: string;
  secondarySchemaLabel?: string;
  associatedTools?: string[];
}

interface DevtoolsPanelProps {
  panelState: UsePanelStateReturn;
  componentItems: RegistryItem[];
  toolItems: RegistryItem[];
  themeClass: string;
  timelineEvents: readonly DevtoolsEvent[];
  onClearTimeline: () => void;
}

type RegistryTab = "components" | "tools";

const DOCS_URLS: Record<RegistryTab, string> = {
  components:
    "https://docs.tambo.co/docs/guides/enable-generative-ui/register-components",
  tools:
    "https://docs.tambo.co/docs/guides/enable-generative-ui/register-interactables",
};

const EMPTY_MESSAGES: Record<
  RegistryTab,
  { heading: string; guidance: string }
> = {
  components: {
    heading: "No components registered",
    guidance: "Register components to let the AI render custom UI.",
  },
  tools: {
    heading: "No tools registered",
    guidance: "Register tools to give the AI actions it can perform.",
  },
};

const EmptyRegistryState: React.FC<{
  tab: RegistryTab;
}> = ({ tab }) => {
  const styles = getStyles();
  const { heading, guidance } = EMPTY_MESSAGES[tab];
  return (
    <div
      style={{
        ...styles.emptyState,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={styles.emptyStateHeading}>{heading}</div>
      <div style={{ marginBottom: 8 }}>{guidance}</div>
      <a
        href={DOCS_URLS[tab]}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.emptyStateLink}
      >
        Read the docs to get started
      </a>
    </div>
  );
};

const filterItems = (items: RegistryItem[], query: string): RegistryItem[] => {
  if (!query) {
    return items;
  }
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower),
  );
};

/**
 * Panel container rendered via React Portal. Includes resize handle, header with tabs/search,
 * and a split content area with sidebar list and detail pane.
 * @param props - Panel state, component items, tool items, and theme class
 * @returns Portal-rendered panel or null when closed/SSR
 */
export const DevtoolsPanel: React.FC<DevtoolsPanelProps> = ({
  panelState,
  componentItems,
  toolItems,
  themeClass,
  timelineEvents,
  onClearTimeline,
}) => {
  const {
    isOpen,
    activeTab,
    panelHeight,
    selectedItem,
    close,
    setActiveTab,
    setPanelHeight,
    setSelectedItem,
  } = panelState;

  const [searchQuery, setSearchQuery] = useState("");

  const { handlePointerDown } = useResize({
    height: panelHeight,
    onHeightChange: setPanelHeight,
  });

  const containerRef = useRef<Element | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<RegistryListHandle>(null);

  // Clear search when tab changes
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // Create portal container
  useEffect(() => {
    const existing = document.querySelector("[data-tambo-devtools-portal]");
    if (existing) {
      containerRef.current = existing;
      return;
    }
    const el = document.createElement("div");
    el.setAttribute("data-tambo-devtools-portal", "");
    document.body.appendChild(el);
    containerRef.current = el;
    return () => {
      el.remove();
      containerRef.current = null;
    };
  }, []);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Focus management: move focus to panel on open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  const isRegistryTab = activeTab === "components" || activeTab === "tools";
  const activeItems = activeTab === "components" ? componentItems : toolItems;
  const filteredItems = useMemo(
    () => filterItems(activeItems, searchQuery),
    [activeItems, searchQuery],
  );
  const selectedItemData = useMemo(
    () => activeItems.find((item) => item.name === selectedItem) ?? null,
    [activeItems, selectedItem],
  );

  if (!isOpen || !containerRef.current) {
    return null;
  }

  const styles = getStyles();

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "components", label: "Components", count: componentItems.length },
    { id: "tools", label: "Tools", count: toolItems.length },
    { id: "timeline", label: "Timeline", count: timelineEvents.length },
  ];

  const hasNoRegistryItems = isRegistryTab && activeItems.length === 0;

  return createPortal(
    <div
      ref={panelRef}
      className={themeClass}
      data-tdt=""
      role="dialog"
      aria-label="Tambo DevTools"
      tabIndex={-1}
      style={{ ...styles.panel, height: panelHeight }}
    >
      {/* Resize handle */}
      <div
        style={styles.resizeHandle}
        onPointerDown={handlePointerDown}
        aria-hidden="true"
      />

      {/* Header with tabs, search, and close button */}
      <div style={styles.header}>
        <div style={styles.tabBar} role="tablist" aria-label="DevTools tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tambo-devtools-tabpanel-${tab.id}`}
              id={`tambo-devtools-tab-${tab.id}`}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span style={styles.tabCount}>({tab.count})</span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          {isRegistryTab && (
            <SearchFilter
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={() => listRef.current?.focus()}
              style={{ ...styles.searchInput, maxWidth: 200 }}
            />
          )}
          <button
            style={styles.closeButton}
            onClick={close}
            aria-label="Close DevTools"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div
        style={styles.content}
        role="tabpanel"
        id={`tambo-devtools-tabpanel-${activeTab}`}
        aria-labelledby={`tambo-devtools-tab-${activeTab}`}
      >
        {activeTab === "timeline" && (
          <TimelineView events={timelineEvents} onClear={onClearTimeline} />
        )}
        {isRegistryTab && hasNoRegistryItems && (
          <EmptyRegistryState tab={activeTab} />
        )}
        {isRegistryTab && !hasNoRegistryItems && (
          <div style={styles.splitContainer}>
            <div style={styles.sidebar}>
              <RegistryList
                ref={listRef}
                items={filteredItems}
                selectedItem={selectedItem}
                onSelect={setSelectedItem}
                emptyMessage="No matches"
                styles={styles}
              />
            </div>
            <DetailView item={selectedItemData} styles={styles} />
          </div>
        )}
      </div>
    </div>,
    containerRef.current,
  );
};
