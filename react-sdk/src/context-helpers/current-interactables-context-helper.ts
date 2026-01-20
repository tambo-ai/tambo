import { ContextHelperFn } from "./types";

/**
 * Prebuilt context helper that provides information about all interactable components currently on the page.
 * This gives the AI awareness of what components it can interact with and their current state.
 * @returns an object with description and components, or null to skip including this context.
 * To disable this helper, override it with a function that returns null:
 * @example
 * ```tsx
 * // To disable the default interactables context
 * const { addContextHelper } = useTamboContextHelpers();
 * addContextHelper("interactables", () => null);
 *
 * // To customize the context
 * addContextHelper("interactables", () => ({
 *   description: "Custom description",
 *   components: getCustomComponentsSubset()
 * }));
 * ```
 */
export const currentInteractablesContextHelper: ContextHelperFn = () => {
  // This will be provided by the interactable provider when it registers this helper
  // Since we're provider-only now, this function gets replaced at runtime
  return null;
};

/**
 * Creates an interactables context helper with access to the current components.
 * This is used internally by TamboInteractableProvider.
 * @param components Array of interactable components
 * @returns A context helper function that returns component metadata or null if no components exist
 */
export const createInteractablesContextHelper = (
  components: unknown[],
): ContextHelperFn => {
  return () => {
    if (!Array.isArray(components) || components.length === 0) {
      return null; // No interactable components on the page
    }

    return {
      components: components.map((component) => {
        // Type guard: ensure component is an object with the expected properties
        if (typeof component !== "object" || component === null) {
          return {
            id: "unknown",
            componentName: "unknown",
            description: "invalid component",
            props: undefined,
            propsSchema: "Not specified",
            state: undefined,
            isSelectedForInteraction: false,
            stateSchema: "Not specified",
          };
        }

        const comp = component as Record<string, unknown>;
        return {
          id: String(comp.id ?? "unknown"),
          componentName: String(comp.name ?? "unknown"),
          description: String(comp.description ?? ""),
          props: comp.props,
          propsSchema: comp.propsSchema
            ? "Available - use component-specific update tools"
            : "Not specified",
          state: comp.state,
          isSelectedForInteraction:
            (comp.isSelectedForInteraction as boolean | undefined) ?? false,
          stateSchema: comp.stateSchema
            ? "Available - use component-specific update tools"
            : "Not specified",
        };
      }),
    };
  };
};
