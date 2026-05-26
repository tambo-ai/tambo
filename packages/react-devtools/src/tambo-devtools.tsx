"use client";
import { safeSchemaToJsonSchema } from "@tambo-ai/client";
import type { SupportedSchema } from "@tambo-ai/client";
import { useTamboRegistry } from "@tambo-ai/react";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DevtoolsPanel } from "./devtools-panel";
import "./devtools.css";
import { getStyles } from "./styles";
import { TamboIcon } from "./tambo-icon";
import { usePanelState } from "./use-panel-state";

/**
 * Converts a schema to JSON Schema, returning undefined for void/empty schemas.
 * @returns The JSON Schema or undefined if the schema has no meaningful type info
 */
const toDisplaySchema = (
  schema: SupportedSchema | undefined,
): Record<string, unknown> | undefined => {
  if (!schema) {
    return undefined;
  }
  const converted = safeSchemaToJsonSchema(schema);
  if (!converted) {
    return undefined;
  }
  // Filter out empty schemas (e.g. z.any() → {}) that have no useful type info
  if (Object.keys(converted).length === 0) {
    return undefined;
  }
  return converted as Record<string, unknown>;
};

export interface TamboDevtoolsProps {
  /** Whether the panel starts open. Default: false */
  initialOpen?: boolean;
  /**
   * Theme for the devtools panel.
   * - `"light"` / `"dark"` — force a specific theme
   * - `"system"` (default) — reads `color-scheme` from `<html>` style attribute
   *   (works with next-themes out of the box), falls back to OS preference via matchMedia
   */
  theme?: "light" | "dark" | "system";
}

/**
 * Reads the resolved color-scheme from `<html style="color-scheme: ...">`, then
 * falls back to the OS `prefers-color-scheme` media query.
 * Reacts to changes in both via MutationObserver and matchMedia listener.
 * @returns Whether dark mode is active
 */
const useResolvedDark = (): boolean =>
  useSyncExternalStore(
    useCallback((cb: () => void) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      // Watch <html> style attribute for color-scheme changes (next-themes, etc.)
      const observer = new MutationObserver(cb);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });

      // Watch OS-level preference as fallback
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", cb);

      return () => {
        observer.disconnect();
        mql.removeEventListener("change", cb);
      };
    }, []),
    () => {
      if (typeof window === "undefined") {
        return false;
      }
      // Prefer explicit color-scheme on <html> (set by next-themes, etc.)
      const htmlColorScheme = document.documentElement.style.colorScheme;
      if (htmlColorScheme === "dark") {
        return true;
      }
      if (htmlColorScheme === "light") {
        return false;
      }
      // Fall back to OS preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    () => false,
  );

/**
 * Floating DevTools panel for Tambo that surfaces registered components and tools at runtime.
 * Must be rendered inside a TamboProvider. Returns null in production when imported from the default entry.
 * @param props - Configuration options
 * @returns Trigger button and floating panel
 */
export const TamboDevtools: React.FC<TamboDevtoolsProps> = ({
  initialOpen,
  theme = "system",
}) => {
  const registry = useTamboRegistry();

  if (!registry.__initialized) {
    throw new Error(
      "TamboDevtools must be rendered inside a TamboProvider. " +
        "Wrap your app with <TamboProvider> and place <TamboDevtools /> inside it.",
    );
  }

  const { componentList, toolRegistry, componentToolAssociations } = registry;

  const panelState = usePanelState({ initialOpen });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const resolvedDark = useResolvedDark();
  const isDark = theme === "system" ? resolvedDark : theme === "dark";
  const themeClass = isDark ? "tdt-dark" : "tdt-light";

  const styles = getStyles();

  const componentItems = useMemo(
    () =>
      Object.values(componentList)
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((comp) => ({
          name: comp.name,
          description: comp.description,
          schema: comp.props,
          schemaLabel: "Props Schema",
          associatedTools: componentToolAssociations[comp.name],
        })),
    [componentList, componentToolAssociations],
  );

  const toolItems = useMemo(
    () =>
      Object.values(toolRegistry)
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((tool) => ({
          name: tool.name,
          description: tool.description,
          schema: toDisplaySchema(tool.inputSchema),
          schemaLabel: "Input Schema",
          secondarySchema: toDisplaySchema(tool.outputSchema),
          secondarySchemaLabel: "Output Schema",
        })),
    [toolRegistry],
  );

  const handleToggle = () => {
    panelState.toggle();
    // Return focus to trigger when closing
    if (panelState.isOpen) {
      triggerRef.current?.focus();
    }
  };

  return (
    <>
      {!panelState.isOpen && (
        <button
          ref={triggerRef}
          className={themeClass}
          data-tdt=""
          style={{
            ...styles.trigger,
            ...(isHovered ? styles.triggerHover : {}),
          }}
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Toggle Tambo DevTools"
          aria-expanded={panelState.isOpen}
        >
          <TamboIcon />
        </button>
      )}
      <DevtoolsPanel
        panelState={panelState}
        componentItems={componentItems}
        toolItems={toolItems}
        themeClass={themeClass}
      />
    </>
  );
};
