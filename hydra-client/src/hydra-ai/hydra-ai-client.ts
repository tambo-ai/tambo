import React, { ComponentType } from "react";
import { updateMessageWithContextAdditions } from "./context-utils";
import { hydraGenerate, hydraHydrate } from "./hydra-api/hydra-api-service";
import { ComponentChoice } from "./model";
import { ChatMessage } from "./model/chat-message";
import { ComponentDecision } from "./model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextTool,
  RegisteredComponent,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { GenerateComponentResponse } from "./model/generate-component-response";
interface ComponentRegistry {
  [key: string]: RegisteredComponent;
}

export interface HydraClientOptions {
  model?: string;
  provider?: string;
  hydraApiKey?: string;
  hydraApiUrl?: string;
  getComponentChoice?: (
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    apiKey?: string,
    url?: string
  ) => Promise<ComponentDecision>;
  hydrateComponentWithToolResponse?: (
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: any,
    apiKey?: string,
    url?: string
  ) => Promise<ComponentChoice>;
}

export default class HydraClient {
  private componentList: ComponentRegistry = {};
  private chatHistory: ChatMessage[] = [];
  private model?: string;
  private provider?: string;
  private hydraApiKey?: string;
  private hydraApiUrl?: string;
  private getComponentChoice: (
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    apiKey?: string,
    url?: string
  ) => Promise<ComponentDecision>;
  private hydrateComponentWithToolResponse: (
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: any,
    apiKey?: string,
    url?: string
  ) => Promise<ComponentChoice>;

  constructor({
    model,
    provider,
    hydraApiKey,
    hydraApiUrl,
    getComponentChoice = hydraGenerate,
    hydrateComponentWithToolResponse = hydraHydrate,
  }: HydraClientOptions = {}) {
    this.model = model;
    this.provider = provider;
    this.hydraApiKey = hydraApiKey;
    this.hydraApiUrl = hydraApiUrl;
    this.getComponentChoice = getComponentChoice;
    this.hydrateComponentWithToolResponse = hydrateComponentWithToolResponse;
  }

  public async registerComponent(
    name: string,
    description: string,
    component: ComponentType<any>,
    propsDefinition: ComponentPropsMetadata = {},
    contextTools: ComponentContextTool[] = []
  ): Promise<void> {
    if (this.componentList[name]) {
      console.warn(`overwriting component ${name}`);
    }
    this.componentList[name] = {
      component,
      name,
      description,
      props: propsDefinition,
      contextTools: contextTools,
    };
  }

  public async generateComponent(
    message: string,
    onProgressUpdate: (stage: string) => void = (progressMessage) => {}
  ): Promise<GenerateComponentResponse> {
    onProgressUpdate("Choosing component");
    const availableComponents = await this.getAvailableComponents(
      this.componentList
    );
    const componentDecision = await this.getComponent(
      message,
      availableComponents,
      this.getComponentChoice
    );
    if (componentDecision.componentName === null) {
      return componentDecision;
    }

    if (componentDecision.toolCallRequest) {
      onProgressUpdate("Getting additional data");
      return await this.handleToolCallRequest(
        componentDecision,
        availableComponents,
        this.hydrateComponentWithToolResponse
      );
    } else {
      this.chatHistory.push({
        sender: "hydra",
        message: componentDecision.message,
      });
      this.chatHistory.push({
        sender: "hydra",
        message: `componentName: ${
          componentDecision.componentName
        } \n props: ${JSON.stringify(componentDecision.props)}`,
      });

      return {
        component: React.createElement(
          this.getComponentFromRegistry(
            componentDecision.componentName,
            this.componentList
          ).component,
          componentDecision.props
        ),
        message: componentDecision.message,
      };
    }
  }

  private async getComponent(
    message: string,
    availableComponents: AvailableComponents,
    getComponentChoice: (
      messageHistory: ChatMessage[],
      availableComponents: AvailableComponents,
      apiKey?: string,
      url?: string
    ) => Promise<ComponentDecision>
  ): Promise<ComponentDecision> {
    const messageWithContextAdditions =
      updateMessageWithContextAdditions(message);

    this.chatHistory.push({
      sender: "user",
      message: messageWithContextAdditions,
    });

    const response = await getComponentChoice(
      this.chatHistory,
      availableComponents,
      this.hydraApiKey,
      this.hydraApiUrl
    );
    if (!response) {
      throw new Error("Failed to fetch component choice from backend");
    }

    if (response.componentName === null) {
      this.chatHistory.push({ sender: "hydra", message: response.message });
      return response;
    }

    return response;
  }

  private async handleToolCallRequest(
    response: ComponentDecision,
    availableComponents: AvailableComponents,
    hydrateComponentWithToolResponse: (
      messageHistory: ChatMessage[],
      component: AvailableComponent,
      toolResponse: any,
      apiKey?: string,
      url?: string
    ) => Promise<ComponentDecision>
  ): Promise<GenerateComponentResponse> {
    if (!response.componentName) {
      throw new Error("Component name is required to run a tool choice");
    }
    const toolResponse = await this.runToolChoice(response);
    const chosenComponent: AvailableComponent =
      availableComponents[response.componentName];
    const hydratedComponentChoice = await hydrateComponentWithToolResponse(
      this.chatHistory,
      chosenComponent,
      toolResponse,
      this.hydraApiKey,
      this.hydraApiUrl
    );

    if (!hydratedComponentChoice.componentName) {
      throw new Error("Something went wrong while hydrating component");
    }

    this.chatHistory.push({
      sender: "hydra",
      message: hydratedComponentChoice.message,
    });

    this.chatHistory.push({
      sender: "hydra",
      message: `componentName: ${
        hydratedComponentChoice.componentName
      } \n props: ${JSON.stringify(hydratedComponentChoice.props)}`,
    });

    return {
      component: React.createElement(
        this.getComponentFromRegistry(
          hydratedComponentChoice.componentName,
          this.componentList
        ).component,
        hydratedComponentChoice.props
      ),
      message: hydratedComponentChoice.message,
    };
  }

  private getComponentFromRegistry(
    componentName: string,
    componentRegistry: ComponentRegistry
  ): RegisteredComponent {
    const componentEntry = componentRegistry[componentName];

    if (!componentEntry) {
      throw new Error(
        `Hydra tried to use Component ${componentName}, but it was not found.`
      );
    }

    return componentEntry;
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
