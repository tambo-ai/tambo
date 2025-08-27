import {
  DEFAULT_OPENAI_MODEL,
  LegacyComponentDecision,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { AvailableComponent } from "./model/component-metadata";
import { Provider } from "./model/providers";
import { runDecisionLoop } from "./services/decision-loop/decision-loop-service";
import { AISdkClient } from "./services/llm/ai-sdk-client";
import { LLMClient } from "./services/llm/llm-client";
import { generateSuggestions } from "./services/suggestion/suggestion.service";
import { SuggestionDecision } from "./services/suggestion/suggestion.types";
import { generateThreadName } from "./services/thread-name/thread-name.service";

interface TamboBackendOptions {
  model?: string;
  provider?: Provider;
  baseURL?: string;
  maxInputTokens?: number | null;
}

/** The current model options for the TamboBackend, filled in with defaults */
export interface ModelOptions {
  readonly model: string;
  readonly provider: Provider;
  readonly baseURL?: string;
  readonly maxInputTokens?: number | null;
}

interface RunDecisionLoopParams {
  messages: ThreadMessage[];
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[];
  customInstructions: string | undefined;
  forceToolChoice?: string;
}

export default class TamboBackend {
  private llmClient: LLMClient;
  /** The current model options for the TamboBackend, filled in with defaults */
  public readonly modelOptions: ModelOptions;
  constructor(
    apiKey: string | undefined,
    chainId: string,
    userId: string,
    options: TamboBackendOptions = {},
  ) {
    const {
      model = DEFAULT_OPENAI_MODEL,
      provider = "openai",
      baseURL,
      maxInputTokens,
    } = options;
    this.modelOptions = {
      model,
      provider,
      baseURL,
      maxInputTokens,
    };
    this.llmClient = new AISdkClient(
      apiKey,
      model,
      provider,
      chainId,
      userId,
      baseURL,
      maxInputTokens,
    );
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

  /**
   * Generates a 'summary' name for a thread based on the messages in the thread
   * @param messages - The messages in the thread
   * @returns A name for the thread
   */
  public async generateThreadName(messages: ThreadMessage[]): Promise<string> {
    return await generateThreadName(this.llmClient, messages);
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
