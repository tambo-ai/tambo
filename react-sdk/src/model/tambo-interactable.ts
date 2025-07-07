export interface InteractableComponent {
  /** Unique identifier for this component instance */
  id: string;
  /** Name of the component */
  componentName: string;
  /** Current props for the component */
  props: Record<string, any>;
  /** Message ID where this component was rendered */
  messageId: string;
  /** Thread ID where this component belongs */
  threadId: string;
  /** Whether this component is currently interactable */
  isInteractable: boolean;
  /** Timestamp when this component was created */
  createdAt: Date;
  /** Timestamp of last interaction */
  lastInteraction?: Date;
  /** Custom metadata for the component */
  metadata?: Record<string, any>;
}

export interface TamboInteractableContext {
  /** List of all interactable components */
  interactableComponents: InteractableComponent[];
  /** Add a new interactable component */
  addInteractableComponent: (
    component: Omit<InteractableComponent, "id" | "createdAt">,
  ) => string;
  /** Remove an interactable component by ID */
  removeInteractableComponent: (id: string) => void;
  /** Update an interactable component's props */
  updateInteractableComponentProps: (
    id: string,
    newProps: Record<string, any>,
  ) => void;
  /** Update an interactable component's metadata */
  updateInteractableComponentMetadata: (
    id: string,
    metadata: Record<string, any>,
  ) => void;
  /** Set whether a component is interactable */
  setInteractableComponentState: (id: string, isInteractable: boolean) => void;
  /** Get an interactable component by ID */
  getInteractableComponent: (id: string) => InteractableComponent | undefined;
  /** Get all interactable components by component name */
  getInteractableComponentsByName: (
    componentName: string,
  ) => InteractableComponent[];
  /** Get all interactable components by thread ID */
  getInteractableComponentsByThread: (
    threadId: string,
  ) => InteractableComponent[];
  /** Clear all interactable components */
  clearAllInteractableComponents: () => void;
  /** Clear interactable components for a specific thread */
  clearInteractableComponentsByThread: (threadId: string) => void;
  /** Mark a component as interacted with */
  markComponentInteracted: (id: string) => void;
}
