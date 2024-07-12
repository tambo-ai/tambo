import React, { ComponentType, ReactElement } from "react";
import chooseComponent from "./hydra-server-action";
import { ComponentChoice } from "./model/component-choice";
import {
  ComponentMetadata,
  RegisteredComponent,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

interface ComponentRegistry {
  [key: string]: RegisteredComponent;
}

export default class HydraClient {
  private componentList: ComponentRegistry = {};

  public registerComponent(
    name: string,
    component: ComponentType<any>,
    propsDefinition?: ComponentPropsMetadata,
    getComponentContext?: () => any | Promise<any>
  ): void {
    if (!this.componentList[name]) {
      const asyncGetComponentContext = getComponentContext
        ? async () => await getComponentContext()
        : undefined;
      this.componentList[name] = {
        component,
        name,
        props: propsDefinition || {},
        getComponentContext: asyncGetComponentContext,
      };
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
      availableComponents: ComponentMetadata[]
    ) => Promise<ComponentChoice> = chooseComponent
  ): Promise<ReactElement> {
    const availableComponents = this.getAvailableComponents(this.componentList);

    const componentMetadataList: ComponentMetadata[] = availableComponents.map(
      (component) => {
        return {
          name: component.name,
          props: component.props,
        } as ComponentMetadata;
      }
    );

    const messageWithData = await this.generateContextMessage(
      message,
      this.componentList
    );

    const response = await callback(messageWithData, componentMetadataList);
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

  private generateContextMessage = async (
    userContext: string,
    componentRegistry: ComponentRegistry
  ): Promise<string> => {
    const availableComponents = this.getAvailableComponents(componentRegistry);

    const componentDataMessagePromises = availableComponents.map(
      async (component) => {
        if (component.getComponentContext) {
          const componentContext = await component.getComponentContext();
          return ` for ${
            component.name
          } the available data is: ${JSON.stringify(componentContext)}`;
        }
      }
    );

    const componentDataMessage = (
      await Promise.all(componentDataMessagePromises)
    ).join(", ");
    const messageWithData = `${userContext} ${componentDataMessage}`;

    return messageWithData;
  };

  private getAvailableComponents = (
    componentRegistry: ComponentRegistry
  ): RegisteredComponent[] => {
    return Object.keys(componentRegistry).map((name) => {
      const componentEntry: RegisteredComponent = componentRegistry[name];
      return {
        component: componentEntry.component,
        name: componentEntry.name,
        props: componentEntry.props,
        getComponentContext: componentEntry.getComponentContext,
      };
    });
  };
}
