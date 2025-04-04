import { LegacyComponentDecision, ThreadMessage } from "@tambo-ai-cloud/core";
import {
  AvailableComponent,
  AvailableComponents,
  ToolResponseBody,
} from "../model/component-metadata";
import { InputContext, InputContextAsArray } from "../model/input-context";
import { Provider } from "../model/providers";
import { SuggestionDecision } from "../services/suggestion/suggestion.types";
import AIService from "./ai-service";

interface HydraBackendOptions {
  version?: "v1" | "v2";
  model?: string;
  provider?: Provider;
}

export default class HydraBackend {
  private aiService: AIService;

  constructor(
    openAIKey: string,
    chainId: string,
    options: HydraBackendOptions = {},
  ) {
    const {
      version = "v1",
      model = "gpt-4o-mini",
      provider = "openai",
    } = options;
    this.aiService = new AIService(
      openAIKey,
      model,
      provider,
      chainId,
      version,
    );
  }

  public async generateSuggestions(
    messageHistory: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream: true,
  ): Promise<AsyncIterableIterator<SuggestionDecision>>;
  public async generateSuggestions(
    messageHistory: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream?: false | undefined,
  ): Promise<SuggestionDecision>;
  public async generateSuggestions(
    messageHistory: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream?: boolean,
  ): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
    const context: InputContextAsArray = {
      messageHistory: messageHistory ?? [],
      availableComponents: availableComponents ?? [],
      threadId,
    };

    return await this.aiService.generateSuggestions(
      context,
      count,
      threadId,
      stream,
    );
  }

  public async generateComponent(
    messageHistory: ThreadMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream: true,
    additionalContext?: string,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>>;
  public async generateComponent(
    messageHistory: ThreadMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream?: false | undefined,
    additionalContext?: string,
  ): Promise<LegacyComponentDecision>;
  public async generateComponent(
    messageHistory: ThreadMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream?: boolean,
    additionalContext?: string,
  ): Promise<
    LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
  > {
    const context: InputContext = {
      messageHistory,
      availableComponents,
      threadId,
      additionalContext,
    };

    return await this.aiService.chooseComponent(context, threadId, stream);
  }

  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    stream: true,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>>;
  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    stream?: false | undefined,
  ): Promise<LegacyComponentDecision>;
  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    stream?: boolean,
  ): Promise<
    LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
  > {
    return await this.aiService.hydrateComponent(
      messageHistory,
      component,
      toolResponse,
      toolCallId,
      threadId,
      stream,
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
