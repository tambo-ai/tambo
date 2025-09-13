import { ContextHelperFn } from "./types";

export const currentInteractablesContextHelper: ContextHelperFn = () => {
  return null;
};

export const createInteractablesContextHelper = (
  getComponents: () => any[],
): ContextHelperFn => {
  return () => {
    try {
      const components = getComponents();
      if (!Array.isArray(components) || components.length === 0) return null;
      return {
        description:
          "These are the interactable components currently visible on the page that you can read and modify. Each component has an id, componentName, current props, and optional schema. You can use tools to update these components on behalf of the user.",
        components: components.map((component) => ({
          id: component.id,
          componentName: component.name,
          description: component.description,
          props: component.props,
          propsSchema: component.propsSchema
            ? "Available - use component-specific update tools"
            : "Not specified",
        })),
      };
    } catch (e) {
      console.error("currentInteractablesContextHelper failed:", e);
      return null;
    }
  };
};

