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
import { Provider } from "./model/providers";
let hydraBackend: HydraBackend;

export async function initBackend(
  model?: string,
  provider?: Provider | undefined,
  apikey?: string
): Promise<void> {
  if (!hydraBackend) {
    let apiKey = apikey || "";
    if (!apiKey) {
      switch (provider) {
        case "openai":
          apiKey = process.env.OPENAI_API_KEY ?? "";
          break;
        case "mistral":
          apiKey = process.env.MISTRAL_API_KEY ?? "";
          break;
        case "anthropic":
          apiKey = process.env.ANTHROPIC_API_KEY ?? "";
          break;
        case "gemini":
          apiKey = process.env.GEMINI_API_KEY ?? "";
          break;
        case "groq":
          apiKey = process.env.GROQ_API_KEY ?? "";
          break;
        case "openrouter":
          apiKey = process.env.OPENROUTER_API_KEY ?? "";
          break;
        default:
          apiKey = process.env.OPENAI_API_KEY ?? "";
      }
    }

    if (apiKey.length < 1) {
      throw new Error(`API key not set for provider: ${provider}`);
    }

    hydraBackend = new HydraBackend(apiKey, model, provider);
  }
}

export async function saveComponent(
  name: string,
  description: string,
  propsDefinition: ComponentPropsMetadata,
  contextToolDefinitions: ComponentContextToolMetadata[]
): Promise<boolean> {
  const success = await hydraBackend.registerComponent(
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
  const response = await hydraBackend.generateComponent(
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
  const response = await hydraBackend.hydrateComponentWithData(
    messageHistory,
    component,
    toolResponse
  );
  return response;
}
