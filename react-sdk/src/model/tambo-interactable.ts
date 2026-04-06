import { SupportedSchema, TamboComponent } from "./component-metadata";

export interface TamboInteractableComponent<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> extends TamboComponent {
  /** Unique identifier for this component instance */
  id: string;
  /** Current props for the component */
  props: Props;
  /** Whether the component is currently selected for interaction. When set, Tambo focuses on this component when responding to the next message. Automatically cleared after the message is sent. */
  isSelected?: boolean;
  /** Current state for the component */
  state?: State;
  /** Optional schema for validating state updates */
  stateSchema?: SupportedSchema<State>;
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
  ) => string;
  /** Get an interactable component by ID */
  getInteractableComponent: <
    P = Record<string, unknown>,
    S = Record<string, unknown>,
  >(
    id: string,
  ) => TamboInteractableComponent<P, S> | undefined;
  /** Get all interactable components by component name */
  getInteractableComponentsByName: (
    componentName: string,
  ) => TamboInteractableComponent[];
  /** Clear all interactable components */
  clearAllInteractableComponents: () => void;
  /** Set state for a specific interactable component */
  setInteractableState: (
    componentId: string,
    key: string,
    value: unknown,
  ) => void;
  /** Get state for a specific interactable component */
  getInteractableComponentState: (
    componentId: string,
  ) => Record<string, unknown> | undefined;
  /**
   * Set whether an interactable component is selected for interaction.
   * Selections are one-shot: they are automatically cleared after the next message is sent.
   */
  setInteractableSelected: (componentId: string, isSelected: boolean) => void;
  /** Clear all interactable component selections */
  clearInteractableSelections: () => void;
}
