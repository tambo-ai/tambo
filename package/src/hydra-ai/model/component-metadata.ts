import { ComponentType } from "react";
import { ComponentPropsMetadata } from "./component-props-metadata";

export interface ComponentMetadata {
  component: ComponentType<any>;
  props: ComponentPropsMetadata;
}
