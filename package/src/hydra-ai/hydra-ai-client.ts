import React, { ComponentType } from "react";
import { updateMessageWithContextAdditions } from "./context-utils";
import {
  chooseComponent,
  hydrateComponent,
  saveComponent,
} from "./hydra-server-action";
import { ComponentChoice } from "./model";
import { ChatMessage } from "./model/chat-message";
import { ComponentDecision } from "./model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextTool,
  ComponentContextToolMetadata,
  RegisteredComponent,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { GenerateComponentResponse } from "./model/generate-component-response";

interface ComponentRegistry {
  [key: string]: RegisteredComponent;
}

export default class HydraClient {
  private componentList: ComponentRegistry = {};
  private chatHistory: ChatMessage[] = [];

  public async registerComponent(
    name: string,
    description: string,
    component: ComponentType<any>,
    propsDefinition: ComponentPropsMetadata = {},
    contextTools: ComponentContextTool[] = [],
    callback: (
      name: string,
      description: string,
      propsDefinition: ComponentPropsMetadata,
      contextToolDefinitions: ComponentContextToolMetadata[]
    ) => Promise<boolean> = saveComponent
  ): Promise<void> {
    const success = await callback(
      name,
      description,
      propsDefinition,
      contextTools.map((tool) => tool.definition)
    );

    if (!success) {
      return;
    }

    if (!this.componentList[name]) {
      this.componentList[name] = {
        component,
        name,
        description,
        props: propsDefinition,
        contextTools: contextTools,
      };
    } else {
      throw new Error(
        `A component with name: ${name} is already registered. Try another name.`
      );
    }
  }

  public async generateComponent(
    message: string,
    getComponentChoice: (
      messageHistory: ChatMessage[],
      availableComponents: AvailableComponents
    ) => Promise<ComponentDecision> = chooseComponent,
    hydrateComponentWithToolResponse: (
      messageHistory: ChatMessage[],
      component: AvailableComponent,
      toolResponse: any
    ) => Promise<ComponentChoice> = hydrateComponent
  ): Promise<GenerateComponentResponse | string> {
    const messageWithContextAdditions =
      updateMessageWithContextAdditions(message);

    this.chatHistory.push({
      sender: "user",
      message: messageWithContextAdditions,
    });

    const availableComponents = await this.getAvailableComponents(
      this.componentList
    );

    const response = await getComponentChoice(
      this.chatHistory,
      availableComponents
    );
    if (!response) {
      throw new Error("Failed to fetch component choice from backend");
    }

    if (response.componentName === null) {
      return response.message;
    }

    const componentEntry = this.componentList[response.componentName];

    if (!componentEntry) {
      throw new Error(
        `Hydra tried to use Component ${response.componentName}, but it was not found.`
      );
    }

    if (response.toolCallRequest) {
      const toolResponse = await this.runToolChoice(response);
      const chosenComponent: AvailableComponent =
        availableComponents[response.componentName];
      const hydratedComponentChoice = await hydrateComponentWithToolResponse(
        this.chatHistory,
        chosenComponent,
        toolResponse
      );

      this.chatHistory.push({
        sender: "hydra",
        message: hydratedComponentChoice.message,
      });

      return {
        component: React.createElement(
          componentEntry.component,
          hydratedComponentChoice.props
        ),
        message: hydratedComponentChoice.message,
      };
    }

    this.chatHistory.push({ sender: "hydra", message: response.message });

    return {
      component: React.createElement(componentEntry.component, response.props),
      message: response.message,
    };
  }

  private getAvailableComponents = async (
    componentRegistry: ComponentRegistry
  ): Promise<AvailableComponents> => {
    // TODO: filter list to only include components that are relevant to user query

    const availableComponents: AvailableComponents = {};

    for (let name of Object.keys(componentRegistry)) {
      const componentEntry: RegisteredComponent = componentRegistry[name];
      availableComponents[name] = {
        name: componentEntry.name,
        description: componentEntry.description,
        props: componentEntry.props,
        contextTools: componentEntry.contextTools.map(
          (tool) => tool.definition
        ),
      };
    }

    return availableComponents;
  };

  private runToolChoice = async (
    componentChoice: ComponentChoice
  ): Promise<any> => {
    const { componentName, toolCallRequest } = componentChoice;

    if (!componentName) {
      throw new Error("Component name is required to run a tool choice");
    }

    if (!toolCallRequest) {
      throw new Error("Tool call request is required to run a tool choice");
    }

    const tool = this.componentList[componentName].contextTools.find(
      (tool) => tool.definition.name === toolCallRequest.toolName
    );

    if (!tool) {
      throw new Error(
        `Hydra tried to use Tool ${toolCallRequest.toolName}, but it was not found.`
      );
    }

    // Assumes parameters are in the order they are defined in the tool
    const parameterValues = toolCallRequest.parameters.map(
      (param) => param.parameterValue
    );

    return tool.getComponentContext(...parameterValues);
  };
}
