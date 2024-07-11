import { ComponentType } from "react";
import { ComponentPropsMetadata } from "./component-props-metadata";

export interface ComponentMetadata {
  name: string;
  props: ComponentPropsMetadata;
}

export interface RegisteredComponent extends ComponentMetadata {
  component: ComponentType<any>;
  getData?: () => any;
}
