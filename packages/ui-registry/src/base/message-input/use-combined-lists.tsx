"use client";

import {
  useTamboMcpPromptList,
  useTamboMcpResourceList,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useDebounce } from "use-debounce";
import type {
  PromptItem,
  PromptProvider,
  ResourceItem,
  ResourceProvider,
} from "./message-input-context";

const EXTERNAL_SEARCH_DEBOUNCE_MS = 200;

/**
 * Removes duplicate resource items based on ID.
 */
const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Filters resource items by query string.
 * Empty query returns all items.
 */
const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Filters prompt items by query string.
 * Empty query returns all items.
 */
const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Options for formatting MCP resources into ResourceItems.
 */
export interface ResourceFormatOptions {
  /** Optional function to create an icon for MCP resources */
  createMcpIcon?: () => React.ReactNode;
}

/**
 * Hook to get a combined resource list that merges MCP resources with an external provider.
 * Returns the combined, filtered resource items.
 *
 * @param externalProvider - Optional external resource provider
 * @param search - Search string to filter resources. For MCP servers, results are filtered locally.
 *                 For registry dynamic sources, the search is passed to listResources(search).
 * @param options - Optional formatting options
 */
export function useCombinedResourceList(
  externalProvider: ResourceProvider | undefined,
  search: string,
  options?: ResourceFormatOptions,
): ResourceItem[] {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP resources to ResourceItems
  const mcpItems: ResourceItem[] = React.useMemo(
    () =>
      mcpResources
        ? (
            mcpResources as {
              resource: { uri: string; name?: string };
            }[]
          ).map((entry) => ({
            // Use the full URI (already includes serverKey prefix from MCP hook)
            // When inserted as @{id}, parseResourceReferences will strip serverKey before sending to backend
            id: entry.resource.uri,
            name: entry.resource.name ?? entry.resource.uri,
            icon: options?.createMcpIcon?.(),
            componentData: { type: "mcp-resource", data: entry },
          }))
        : [],
    [mcpResources, options],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<ResourceItem[]>([]);

  // Fetch external resources when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external resources", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine and dedupe - MCP resources are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterResourceItems(externalItems, search);
    return dedupeResourceItems([...mcpItems, ...filteredExternal]);
  }, [mcpItems, externalItems, search]);

  return combined;
}

/**
 * Options for formatting MCP prompts into PromptItems.
 */
export interface PromptFormatOptions {
  /** Optional function to create an icon for MCP prompts */
  createMcpIcon?: () => React.ReactNode;
}

/**
 * Hook to get a combined prompt list that merges MCP prompts with an external provider.
 * Returns the combined, filtered prompt items.
 *
 * @param externalProvider - Optional external prompt provider
 * @param search - Search string to filter prompts by name. MCP prompts are filtered via the hook.
 * @param options - Optional formatting options
 */
export function useCombinedPromptList(
  externalProvider: PromptProvider | undefined,
  search: string,
  options?: PromptFormatOptions,
): PromptItem[] {
  // Pass search to MCP hook for filtering
  const { data: mcpPrompts } = useTamboMcpPromptList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP prompts to PromptItems (mark with mcp-prompt: prefix for special handling)
  const mcpItems: PromptItem[] = React.useMemo(
    () =>
      mcpPrompts
        ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
            id: `mcp-prompt:${entry.prompt.name}`,
            name: entry.prompt.name,
            icon: options?.createMcpIcon?.(),
            text: "", // Text will be fetched when selected via useTamboMcpPrompt
          }))
        : [],
    [mcpPrompts, options],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<PromptItem[]>([]);

  // Fetch external prompts when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external prompts", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine - MCP prompts are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterPromptItems(externalItems, search);
    return [...mcpItems, ...filteredExternal];
  }, [mcpItems, externalItems, search]);

  return combined;
}
