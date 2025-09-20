import { InjectionKey, inject, provide, reactive } from "vue";
import { z } from "zod";
import { TamboInteractableComponent, type TamboInteractableContext } from "../model/tambo-interactable";
import { useTamboComponent } from "./tambo-component-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

export const TamboInteractableKey: InjectionKey<TamboInteractableContext> = Symbol("TamboInteractableContext");

export function provideTamboInteractable() {
  const state = reactive<{ interactableComponents: TamboInteractableComponent[] }>({ interactableComponents: [] });
  const { registerTool } = useTamboComponent();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  const contextHelper = () => {
    return { components: state.interactableComponents };
  };
  addContextHelper("interactables", contextHelper);

  const updateInteractableComponentProps = (id: string, newProps: Record<string, any>) => {
    let updateResult = "Updated successfully";
    const idx = state.interactableComponents.findIndex((c) => c.id === id);
    if (idx === -1) return `Error: Component with ID ${id} not found`;
    const original = state.interactableComponents[idx];
    const updated = { ...original, props: { ...original.props, ...newProps } };
    const propsChanged = JSON.stringify(original.props) !== JSON.stringify(updated.props);
    if (!propsChanged) return `Warning: No changes detected for component with ID ${id}. The update might not have worked.`;
    state.interactableComponents.splice(idx, 1, updated);
    return updateResult;
  };

  const registerInteractableComponentUpdateTool = (component: TamboInteractableComponent) => {
    const schemaForArgs =
      typeof (component as any).propsSchema === "object" && "describe" in (component as any).propsSchema
        ? (component as any).propsSchema
        : z.object({});
    registerTool({
      name: `update_interactable_component_${component.id}`,
      description: `Update the props of interactable component ${component.id} (${component.name})`,
      tool: (componentId: string, newProps: any) => updateInteractableComponentProps(componentId, newProps),
      toolSchema: z
        .function()
        .args(z.string().describe("The ID of the interactable component to update"), schemaForArgs.describe("The new props to update the component with"))
        .returns(z.string()),
    });
  };

  const addInteractableComponent = (
    component: Omit<TamboInteractableComponent, "id" | "createdAt">,
  ): string => {
    const id = `${component.name}-${Math.random().toString(36).slice(2, 11)}`;
    const newComponent: TamboInteractableComponent = { ...component, id } as any;
    registerInteractableComponentUpdateTool(newComponent);
    state.interactableComponents = [...state.interactableComponents, newComponent];
    return id;
  };

  const removeInteractableComponent = (id: string) => {
    state.interactableComponents = state.interactableComponents.filter((c) => c.id !== id);
  };

  const getInteractableComponent = (id: string) => {
    return state.interactableComponents.find((c) => c.id === id);
  };

  const getInteractableComponentsByName = (componentName: string) => {
    return state.interactableComponents.filter((c) => c.name === componentName);
  };

  const clearAllInteractableComponents = () => {
    state.interactableComponents = [];
  };

  // Register helper tools when list is non-empty
  const registerHelperToolsIfNeeded = () => {
    if (state.interactableComponents.length === 0) return;
    registerTool({
      name: "get_all_interactable_components",
      description:
        "Only use this tool if the user is asking about interactable components.Get all currently interactable components with their details including their current props. These are components that you can interact with on behalf of the user.",
      tool: () => ({ components: state.interactableComponents }),
      toolSchema: z.function().returns(
        z.object({
          components: z.array(
            z.object({ id: z.string(), componentName: z.string(), props: z.record(z.any()), propsSchema: z.object({}).optional() }),
          ),
        }),
      ),
    });
    registerTool({
      name: "get_interactable_component_by_id",
      description: "Get a specific interactable component by its ID",
      tool: (componentId: string) => {
        const component = state.interactableComponents.find((c) => c.id === componentId);
        if (!component) return { success: false, error: `Component with ID ${componentId} not found` };
        return { success: true, component: { id: component.id, componentName: component.name, props: component.props } };
      },
      toolSchema: z
        .function()
        .args(z.string())
        .returns(
          z.object({
            success: z.boolean(),
            component: z
              .object({ id: z.string(), componentName: z.string(), props: z.record(z.any()) })
              .optional(),
            error: z.string().optional(),
          }),
        ),
    });
    registerTool({
      name: "remove_interactable_component",
      description: "Remove an interactable component from the system",
      tool: (componentId: string) => {
        const component = state.interactableComponents.find((c) => c.id === componentId);
        if (!component) return { success: false, error: `Component with ID ${componentId} not found` };
        state.interactableComponents = state.interactableComponents.filter((c) => c.id !== componentId);
        return { success: true, componentId, removedComponent: { id: component.id, componentName: component.name, props: component.props } };
      },
      toolSchema: z
        .function()
        .args(z.string())
        .returns(
          z.object({
            success: z.boolean(),
            componentId: z.string(),
            removedComponent: z.object({ id: z.string(), componentName: z.string(), props: z.record(z.any()) }),
            error: z.string().optional(),
          }),
        ),
    });
  };

  registerHelperToolsIfNeeded();

  const value: TamboInteractableContext = {
    get interactableComponents() {
      return state.interactableComponents;
    },
    addInteractableComponent,
    removeInteractableComponent,
    updateInteractableComponentProps,
    getInteractableComponent,
    getInteractableComponentsByName,
    clearAllInteractableComponents,
  };

  provide(TamboInteractableKey, value);
  return value;
}

export function useTamboInteractable() {
  const ctx = inject(TamboInteractableKey);
  if (!ctx) throw new Error("useTamboInteractable must be used after provideTamboInteractable");
  return ctx;
}

export function useCurrentInteractablesSnapshot() {
  const { interactableComponents } = useTamboInteractable();
  return interactableComponents.map((c) => ({ ...c, props: { ...c.props } }));
}

