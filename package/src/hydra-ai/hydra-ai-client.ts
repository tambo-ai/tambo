import React, { ComponentType, ReactElement } from "react";
import chooseComponent from "./hydra-server-action";
import { ComponentChoice } from "./model/component-choice";
import { ComponentMetadata } from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

interface ComponentRegistry {
  [key: string]: ComponentMetadata;
}

export default class HydraClient {
  private componentList: ComponentRegistry = {};

  public registerComponent(
    name: string,
    component: ComponentType<any>,
    propsDefinition?: ComponentPropsMetadata
  ): void {
    if (!this.componentList[name]) {
      this.componentList[name] = { component, props: propsDefinition || {} };
    } else {
      throw new Error(
        `A component with name: ${name} is already registered. Try another name.`
      );
    }
  }

  public async generateComponent(
    message: string,
    callback: (
      message: string,
      availableComponents: { componentName: string; props: any }[]
    ) => Promise<ComponentChoice> = chooseComponent
  ): Promise<ReactElement> {
    const availableComponents = Object.keys(this.componentList).map((name) => ({
      componentName: name,
      props: this.componentList[name].props,
    }));
    const response = await callback(message, availableComponents);
    if (!response) {
      throw new Error("Failed to fetch component choice from backend");
    }
    const componentEntry = this.componentList[response.componentName];

    if (!componentEntry) {
      throw new Error(
        `Hydra tried to use Component ${response.componentName}, but it was not found.`
      );
    }

    return React.createElement(componentEntry.component, response.props);
  }
}
