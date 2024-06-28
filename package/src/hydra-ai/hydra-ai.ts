import React, { ComponentType, ReactElement } from "react";
import AIService from "./ai-service";
import { ComponentMetadata } from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { InputContext } from "./model/input-context";

interface ComponentRegistry {
  [key: string]: ComponentMetadata;
}

export default class Hydra {
  private componentList: ComponentRegistry = {};
  private aiService: AIService;

  constructor(openAIKey: string, openAIModel = "gpt-4o") {
    this.aiService = new AIService(openAIKey, openAIModel);
  }

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

  public async generateComponent(message: string): Promise<ReactElement> {
    const context: InputContext = {
      chatMessage: message,
      availableComponents: Object.keys(this.componentList).map((name) => ({
        componentName: name,
        props: this.componentList[name].props,
      })),
    };
    const componentChoice = await this.aiService.chooseComponent(context);
    const componentEntry = this.componentList[componentChoice.componentName];

    if (!componentEntry) {
      throw new Error(
        `Hydra tried to use Component ${componentChoice.componentName}, but it was not found.`
      );
    }

    return React.createElement(componentEntry.component, componentChoice.props);
  }
}
