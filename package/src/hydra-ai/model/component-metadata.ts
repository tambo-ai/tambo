import { ComponentType } from "react";
import { ComponentPropsMetadata } from "./component-props-metadata";

export interface ComponentMetadata {
  name: string;
  props: ComponentPropsMetadata;
}

export interface RegisteredComponent extends ComponentMetadata {
  component: ComponentType<any>;
  getComponentContext?: () => Promise<any>;
}

export interface ComponentWithContext extends ComponentMetadata {
  context: any;
}

export interface AvailableComponents {
  [key: string]: ComponentWithContext;
}