import { defineComponent, h, provide } from "vue";
import { z } from "zod";
import type { TamboTool } from "../model/component-metadata";
import { createInteractablesContextHelper } from "../context-helpers/current-interactables-context-helper";
import { useTamboComponent } from "./tambo-component-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

export interface TamboInteractableComponent {
  id: string;
  name: string;
  description: string;
  component: any;
  props: Record<string, any>;
  propsSchema?: z.ZodTypeAny | Record<string, any>;
}

export interface TamboInteractableContext {
  interactableComponents: TamboInteractableComponent[];
  addInteractableComponent: (component: Omit<TamboInteractableComponent, "id">) => string;
  removeInteractableComponent: (id: string) => void;
  updateInteractableComponentProps: (id: string, newProps: Record<string, any>) => string;
  getInteractableComponent: (id: string) => TamboInteractableComponent | undefined;
  getInteractableComponentsByName: (componentName: string) => TamboInteractableComponent[];
  clearAllInteractableComponents: () => void;
}

const TAMBO_INTERACTABLE_CTX = Symbol("TAMBO_INTERACTABLE_CTX") as import("vue").InjectionKey<TamboInteractableContext>;

export const TamboInteractableProvider = defineComponent({
  name: "TamboInteractableProvider",
  setup(_props, { slots }) {
    const state: TamboInteractableComponent[] = [];
    const { registerTool } = useTamboComponent();
    const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

    const contextHelper = () => createInteractablesContextHelper(() => state)();
    addContextHelper("interactables", contextHelper);
    // Provider unmount isn't explicitly handled here; consumer tree lifetime typically matches provider wrappers

    const updateInteractableComponentProps = (id: string, newProps: Record<string, any>) => {
      let updateResult = "Updated successfully";
      const idx = state.findIndex((c) => c.id === id);
      if (idx === -1) return `Error: Component with ID ${id} not found`;
      const original = state[idx];
      const updated = { ...original, props: { ...original.props, ...newProps } };
      const changed = JSON.stringify(original.props) !== JSON.stringify(updated.props);
      if (!changed) return `Warning: No changes detected for component with ID ${id}. The update might not have worked.`;
      state.splice(idx, 1, updated);
      return updateResult;
    };

    const registerInteractableComponentUpdateTool = (component: TamboInteractableComponent) => {
      const schemaForArgs = typeof component.propsSchema === "object" && (component.propsSchema as any).describe
        ? (component.propsSchema as any)
        : z.object({});
      const tool: TamboTool = {
        name: `update_interactable_component_${component.id}`,
        description: `Update the props of interactable component ${component.id} (${component.name})`,
        tool: (componentId: string, newProps: any) => updateInteractableComponentProps(componentId, newProps),
        toolSchema: z
          .function()
          .args(
            z.string().describe("The ID of the interactable component to update"),
            (schemaForArgs as any).describe("The new props to update the component with"),
          )
          .returns(z.string()),
      } as any;
      registerTool(tool);
    };

    const addInteractableComponent: TamboInteractableContext["addInteractableComponent"] = (component) => {
      const id = `${component.name}-${Math.random().toString(36).slice(2, 11)}`;
      const newComponent: TamboInteractableComponent = { ...component, id } as any;
      registerInteractableComponentUpdateTool(newComponent);
      state.push(newComponent);
      return id;
    };

    const removeInteractableComponent = (id: string) => {
      const idx = state.findIndex((c) => c.id === id);
      if (idx >= 0) state.splice(idx, 1);
    };
    const getInteractableComponent = (id: string) => state.find((c) => c.id === id);
    const getInteractableComponentsByName = (componentName: string) => state.filter((c) => c.name === componentName);
    const clearAllInteractableComponents = () => { state.splice(0, state.length); };

    const value: TamboInteractableContext = {
      interactableComponents: state,
      addInteractableComponent,
      removeInteractableComponent,
      updateInteractableComponentProps,
      getInteractableComponent,
      getInteractableComponentsByName,
      clearAllInteractableComponents,
    };

    provide(TAMBO_INTERACTABLE_CTX, value);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTamboInteractable() {
  const ctx = (await import("vue")).inject(TAMBO_INTERACTABLE_CTX);
  if (!ctx) throw new Error("useTamboInteractable must be used within a TamboInteractableProvider");
  return ctx;
}

export function useCurrentInteractablesSnapshot() {
  const { interactableComponents } = useTamboInteractable();
  return interactableComponents.map((c) => ({ ...c, props: { ...c.props } }));
}

