import { deepEqual } from "fast-equals";
import type { TamboInteractableComponent, SupportedSchema } from "../types.js";

/**
 * Interactable store interface
 */
export interface InteractableStore {
  readonly interactableComponents: TamboInteractableComponent[];
  addInteractableComponent(
    component: Omit<TamboInteractableComponent, "id">,
  ): string;
  removeInteractableComponent(id: string): void;
  updateInteractableComponentProps(
    id: string,
    newProps: Record<string, unknown>,
  ): string;
  getInteractableComponent<
    P = Record<string, unknown>,
    S = Record<string, unknown>,
  >(
    id: string,
  ): TamboInteractableComponent<P, S> | undefined;
  getInteractableComponentsByName(name: string): TamboInteractableComponent[];
  clearAllInteractableComponents(): void;
  setInteractableState(componentId: string, key: string, value: unknown): void;
  getInteractableComponentState(
    componentId: string,
  ): Record<string, unknown> | undefined;
  setInteractableSelected(componentId: string, isSelected: boolean): void;
  clearInteractableSelections(): void;
}

/**
 * Create an interactable store for managing interactive components
 * @returns Interactable store with reactive state
 */
export function createInteractableStore(): InteractableStore {
  let interactableComponents = $state<TamboInteractableComponent[]>([]);

  function addInteractableComponent(
    component: Omit<TamboInteractableComponent, "id">,
  ): string {
    // Generate cryptographically secure unique ID
    const id = `${component.name}-${crypto.randomUUID()}`;

    const newComponent: TamboInteractableComponent = {
      ...component,
      id,
      state: component.state ?? {},
    };

    interactableComponents = [...interactableComponents, newComponent];
    return id;
  }

  function removeInteractableComponent(id: string): void {
    interactableComponents = interactableComponents.filter((c) => c.id !== id);
  }

  function updateInteractableComponentProps(
    id: string,
    newProps: Record<string, unknown>,
  ): string {
    if (!newProps || Object.keys(newProps).length === 0) {
      return `Warning: No props provided for component with ID ${id}.`;
    }

    const componentIndex = interactableComponents.findIndex((c) => c.id === id);
    if (componentIndex < 0) {
      return `Error: Component with ID ${id} not found.`;
    }

    const component = interactableComponents[componentIndex];

    // Check if props actually changed
    const propsChanged = Object.entries(newProps).some(
      ([key, value]) => component.props[key] !== value,
    );

    if (!propsChanged) {
      return "No changes detected";
    }

    // Apply partial update
    const updated: TamboInteractableComponent = {
      ...component,
      props: { ...component.props, ...newProps },
    };

    interactableComponents = [
      ...interactableComponents.slice(0, componentIndex),
      updated,
      ...interactableComponents.slice(componentIndex + 1),
    ];

    return "Updated successfully";
  }

  function getInteractableComponent<
    P = Record<string, unknown>,
    S = Record<string, unknown>,
  >(id: string): TamboInteractableComponent<P, S> | undefined {
    return interactableComponents.find((c) => c.id === id) as
      | TamboInteractableComponent<P, S>
      | undefined;
  }

  function getInteractableComponentsByName(
    name: string,
  ): TamboInteractableComponent[] {
    return interactableComponents.filter((c) => c.name === name);
  }

  function clearAllInteractableComponents(): void {
    interactableComponents = [];
  }

  function setInteractableState(
    componentId: string,
    key: string,
    value: unknown,
  ): void {
    const componentIndex = interactableComponents.findIndex(
      (c) => c.id === componentId,
    );
    if (componentIndex < 0) {
      console.warn(
        `Tried to update state for component ${componentId} but it was not found.`,
      );
      return;
    }

    const component = interactableComponents[componentIndex];
    const newState = {
      ...component.state,
      [key]: value,
    };

    // Skip if no actual change
    if (deepEqual(component.state, newState)) {
      return;
    }

    const updated: TamboInteractableComponent = {
      ...component,
      state: newState,
    };

    interactableComponents = [
      ...interactableComponents.slice(0, componentIndex),
      updated,
      ...interactableComponents.slice(componentIndex + 1),
    ];
  }

  function getInteractableComponentState(
    componentId: string,
  ): Record<string, unknown> | undefined {
    const component = interactableComponents.find((c) => c.id === componentId);
    return component?.state;
  }

  function setInteractableSelected(
    componentId: string,
    isSelected: boolean,
  ): void {
    const componentIndex = interactableComponents.findIndex(
      (c) => c.id === componentId,
    );
    if (componentIndex < 0) return;

    const component = interactableComponents[componentIndex];
    if (component.isSelected === isSelected) return;

    const updated: TamboInteractableComponent = {
      ...component,
      isSelected,
    };

    interactableComponents = [
      ...interactableComponents.slice(0, componentIndex),
      updated,
      ...interactableComponents.slice(componentIndex + 1),
    ];
  }

  function clearInteractableSelections(): void {
    if (!interactableComponents.some((c) => c.isSelected)) return;

    interactableComponents = interactableComponents.map((c) =>
      c.isSelected ? { ...c, isSelected: false } : c,
    );
  }

  return {
    get interactableComponents() {
      return interactableComponents;
    },
    addInteractableComponent,
    removeInteractableComponent,
    updateInteractableComponentProps,
    getInteractableComponent,
    getInteractableComponentsByName,
    clearAllInteractableComponents,
    setInteractableState,
    getInteractableComponentState,
    setInteractableSelected,
    clearInteractableSelections,
  };
}

export type { InteractableStore as InteractableStoreType };
