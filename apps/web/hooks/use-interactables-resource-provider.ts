import type {
  ResourceItem,
  ResourceProvider,
} from "@tambo-ai/ui-registry/components/message-input";
import {
  useCurrentInteractablesSnapshot,
  useTamboContextAttachment,
} from "@tambo-ai/react";
import { Cuboid } from "lucide-react";
import * as React from "react";

/**
 * Creates a resource provider that combines interactable components with optional external resources.
 *
 * This hook is specific to apps/web and handles the Tambo-specific interactables system.
 * It should NOT be synced to the CLI registry.
 *
 * **Note:** Since MessageInputTextarea now handles ref forwarding internally, this hook
 * can return fresh callbacks on each render without worrying about closure issues.
 *
 * @param externalResourceProvider - Optional external resource provider to merge with interactables
 * @returns An object containing the combined resource provider and resource selection handler
 */
export const useInteractablesResourceProvider = (
  externalResourceProvider?: ResourceProvider,
) => {
  const { addContextAttachment } = useTamboContextAttachment();
  const interactables = useCurrentInteractablesSnapshot();

  // Create a combined resource provider that includes interactables + external provider
  const combinedResourceProvider = React.useMemo<ResourceProvider>(
    () => ({
      search: async (query: string): Promise<ResourceItem[]> => {
        // Get interactable items
        const interactableItems: ResourceItem[] = interactables.map(
          (component) => ({
            id: component.id,
            name: component.name,
            icon: React.createElement(Cuboid, { className: "w-4 h-4" }),
            componentData: component,
          }),
        );

        // Get external resources if provider is available
        const externalItems = externalResourceProvider
          ? await externalResourceProvider.search(query)
          : [];

        // Combine and filter by query
        const combined = [...interactableItems, ...externalItems];
        if (query === "") return combined;

        const normalizedQuery = query.toLocaleLowerCase();
        return combined.filter((item) =>
          item.name.toLocaleLowerCase().includes(normalizedQuery),
        );
      },
    }),
    [interactables, externalResourceProvider],
  );

  // Handle resource selection - add as context attachment
  const handleResourceSelect = React.useCallback(
    (item: ResourceItem) => {
      addContextAttachment({
        context: item.id,
        displayName: item.name,
        type: "component",
      });
    },
    [addContextAttachment],
  );

  return {
    resourceProvider: combinedResourceProvider,
    onResourceSelect: handleResourceSelect,
  };
};
