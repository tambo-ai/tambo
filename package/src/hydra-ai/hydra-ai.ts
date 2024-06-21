import React, { ComponentType, ReactElement } from "react";
import AIService from "./ai-service";
import { InputContext } from "./model/input-context";

interface ComponentRegistry {
  [key: string]: ComponentType<any>;
}

export default class Hydra {
  private componentList: ComponentRegistry = {};
  private aiService: AIService;

  constructor(openAIKey: string) {
    this.aiService = new AIService(openAIKey);
  }

  public registerComponent(name: string, component: ComponentType<any>): void {
    if (!this.componentList[name]) {
      this.componentList[name] = component;
    } else {
      throw new Error(
        `A component with name: ${name} is already registered. Try another name.`
      );
    }
  }

  public async generateComponent(message: string): Promise<ReactElement> {
    const context: InputContext = {
      chatMessage: message,
      availableComponentNames: Object.keys(this.componentList),
    };
    const componentChoice = await this.aiService.chooseComponent(context);
    const component = this.componentList[componentChoice.componentName];

    if (!component) {
      throw new Error(
        `Hydra tried to use Component ${componentChoice.componentName}, but it was not found.`
      );
    }

    return React.createElement(component, componentChoice.props);
  }
}
