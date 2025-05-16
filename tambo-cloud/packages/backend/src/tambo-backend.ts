import { LegacyComponentDecision, ThreadMessage } from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { AvailableComponent } from "./model/component-metadata";
import { Provider } from "./model/providers";
import { runDecisionLoop } from "./services/decision-loop/decision-loop-service";
import { TokenJSClient } from "./services/llm/token-js-client";
import { generateSuggestions } from "./services/suggestion/suggestion.service";
import { SuggestionDecision } from "./services/suggestion/suggestion.types";

interface HydraBackendOptions {
  model?: string;
  provider?: Provider;
}

interface RunDecisionLoopParams {
  messages: ThreadMessage[];
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[];
  additionalContext?: string;
  customInstructions: string | undefined;
  forceToolChoice?: string;
}

export default class TamboBackend {
  private llmClient: TokenJSClient;
  constructor(
    openAIKey: string,
    private chainId: string,
    options: HydraBackendOptions = {},
  ) {
    const { model = "gpt-4o-mini", provider = "openai" } = options;
    this.llmClient = new TokenJSClient(openAIKey, model, provider, chainId);
  }

  public async generateSuggestions(
    messages: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream: true,
  ): Promise<AsyncIterableIterator<SuggestionDecision>>;
  public async generateSuggestions(
    messages: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream?: false | undefined,
  ): Promise<SuggestionDecision>;
  public async generateSuggestions(
    messages: ThreadMessage[],
    count: number,
    availableComponents: AvailableComponent[],
    threadId: string,
    stream?: boolean,
  ): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
    return await generateSuggestions(
      this.llmClient,
      messages,
      availableComponents,
      count,
      threadId,
      stream,
    );
  }

  public async runDecisionLoop(
    params: RunDecisionLoopParams,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>> {
    return runDecisionLoop(
      this.llmClient,
      params.messages,
      params.strictTools,
      params.customInstructions,
      params.forceToolChoice,
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
