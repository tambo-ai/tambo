import { TamboComponent } from "./component-metadata";

export interface TamboInteractableComponent extends TamboComponent {
  /** Unique identifier for this component instance */
  id: string;
  /** Current props for the component */
  props: Record<string, any>;
}

export interface TamboInteractableContext {
  /** List of all interactable components */
  interactableComponents: TamboInteractableComponent[];
  /** Add a new interactable component */
  addInteractableComponent: (
    component: Omit<TamboInteractableComponent, "id" | "createdAt">,
  ) => string;
  /** Remove an interactable component by ID */
  removeInteractableComponent: (id: string) => void;
  /** Update an interactable component's props */
  updateInteractableComponentProps: (
    id: string,
    newProps: Record<string, any>,
  ) => void;
  /** Get an interactable component by ID */
  getInteractableComponent: (
    id: string,
  ) => TamboInteractableComponent | undefined;
  /** Get all interactable components by component name */
  getInteractableComponentsByName: (
    componentName: string,
  ) => TamboInteractableComponent[];
  /** Clear all interactable components */
  clearAllInteractableComponents: () => void;
}
