"use server";

import HydraBackend from "./hydra-ai-backend";
import { ChatMessage } from "./model/chat-message";
import { ComponentDecision } from "./model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";

let hydraBackend: HydraBackend | null;

const getHydraBackend = (): HydraBackend => {
  if (!hydraBackend) {
    hydraBackend = new HydraBackend(
      process.env.OPENAI_API_KEY ?? "",
      "gpt-4o",
      process.env.POSTGRES_DB_URL
    );
  }
  return hydraBackend;
};

export async function saveComponent(
  name: string,
  description: string,
  propsDefinition: ComponentPropsMetadata,
  contextToolDefinitions: ComponentContextToolMetadata[]
): Promise<boolean> {
  const hydra = getHydraBackend();
  const success = await hydra.registerComponent(
    name,
    description,
    propsDefinition,
    contextToolDefinitions
  );
  return success;
}

export async function chooseComponent(
  messageHistory: ChatMessage[],
  availableComponents: AvailableComponents
): Promise<ComponentDecision> {
  const hydra = getHydraBackend();
  const response = await hydra.generateComponent(
    messageHistory,
    availableComponents
  );
  return response;
}

export async function hydrateComponent(
  messageHistory: ChatMessage[],
  component: AvailableComponent,
  toolResponse: any
): Promise<ComponentDecision> {
  const hydra = getHydraBackend();
  const response = await hydra.hydrateComponentWithData(
    messageHistory,
    component,
    toolResponse
  );
  return response;
}
