import { TamboComponent } from "./component-metadata";

export interface TamboInteractableComponent extends TamboComponent {
  id: string;
  props: Record<string, any>;
}

export interface TamboInteractableContext {
  interactableComponents: TamboInteractableComponent[];
  addInteractableComponent: (
    component: Omit<TamboInteractableComponent, "id" | "createdAt">
  ) => string;
  removeInteractableComponent: (id: string) => void;
  updateInteractableComponentProps: (
    id: string,
    newProps: Record<string, any>
  ) => void;
  getInteractableComponent: (
    id: string
  ) => TamboInteractableComponent | undefined;
  getInteractableComponentsByName: (
    componentName: string
  ) => TamboInteractableComponent[];
  clearAllInteractableComponents: () => void;
}

