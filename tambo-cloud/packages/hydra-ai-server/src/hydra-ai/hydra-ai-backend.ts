import { ComponentDecision } from "@use-hydra-ai/core";
import AIService from "./ai-service";
import { ChatMessage } from "./model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";

export default class HydraBackend {
  private aiService: AIService;

  constructor(
    openAIKey: string,
    chainId: string,
    openAIModel = "gpt-4o",
    provider: Provider = "openai",
  ) {
    this.aiService = new AIService(openAIKey, openAIModel, provider, chainId);
  }

  public async registerComponent(
    name: string,
    description: string,
    propsDefinition?: ComponentPropsMetadata,
    contextToolDefinitions?: ComponentContextToolMetadata[],
  ): Promise<boolean> {
    // Component registration logic would go here
    // For now, always return true as if registration was successful
    return true;
  }

  public async generateComponent(
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
  ): Promise<ComponentDecision> {
    const context: InputContext = {
      messageHistory,
      availableComponents,
      threadId: threadId,
    };

    return this.aiService.chooseComponent(context, threadId);
  }

  public async hydrateComponentWithData(
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: any,
    threadId: string,
  ): Promise<ComponentDecision> {
    return this.aiService.hydrateComponent(
      messageHistory,
      component,
      toolResponse,
      threadId,
    );
  }
}
/**
 * Generate a consistent, valid UUID from a string using SHA-256
 * This is used to ensure that the same string will always generate the same UUID
 * This is important for consistent logging and tracing
 */
export async function generateChainId(stringValue: string) {
  const hashedValueBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stringValue),
  );
  const hashedValue = Array.from(new Uint8Array(hashedValueBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // Set the version to 4 (UUIDv4)
  const versioned = hashedValue.slice(0, 12) + "4" + hashedValue.slice(13, 32);

  // Set the variant to 8, 9, A, or B
  const variant = ((parseInt(hashedValue[16], 16) & 0x3) | 0x8).toString(16);
  const varianted = versioned.slice(0, 16) + variant + versioned.slice(17);

  const consistentUUID = [
    varianted.slice(0, 8),
    varianted.slice(8, 12),
    varianted.slice(12, 16),
    varianted.slice(16, 20),
    varianted.slice(20, 32),
  ].join("-");
  return consistentUUID;
}
