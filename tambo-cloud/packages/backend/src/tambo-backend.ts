import { LegacyComponentDecision, ThreadMessage } from "@tambo-ai-cloud/core";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
  ToolResponseBody,
} from "./model/component-metadata";
import { InputContext, InputContextAsArray } from "./model/input-context";
import { Provider } from "./model/providers";
import { decideComponent } from "./services/component/component-decision-service";
import { hydrateComponent } from "./services/component/component-hydration-service";
import { runDecisionLoop } from "./services/decision-loop/decision-loop-service";
import { TokenJSClient } from "./services/llm/token-js-client";
import { generateSuggestions } from "./services/suggestion/suggestion.service";
import { SuggestionDecision } from "./services/suggestion/suggestion.types";
import { SystemTools } from "./systemTools";

interface HydraBackendOptions {
  version?: "v1" | "v2";
  model?: string;
  provider?: Provider;
}

interface RunDecisionLoopParams {
  messageHistory: ThreadMessage[];
  availableComponents: AvailableComponent[];
  clientTools: ComponentContextToolMetadata[];
  systemTools?: SystemTools;
  toolResponse?: ToolResponseBody;
  toolCallId?: string;
  additionalContext?: string;
}

export default class TamboBackend {
  private llmClient: TokenJSClient;
  private version: "v1" | "v2";
  constructor(
    openAIKey: string,
    private chainId: string,
    options: HydraBackendOptions = {},
  ) {
    const {
      version = "v1",
      model = "gpt-4o-mini",
      provider = "openai",
    } = options;
    this.version = version;
    this.llmClient = new TokenJSClient(openAIKey, model, provider, chainId);
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
      messageHistory,
      availableComponents,
      threadId,
    };

    return await generateSuggestions(
      this.llmClient,
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
    systemTools: SystemTools | undefined,
    stream: true,
    additionalContext?: string,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>>;
  public async generateComponent(
    messageHistory: ThreadMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    systemTools: SystemTools | undefined,
    stream?: false | undefined,
    additionalContext?: string,
  ): Promise<LegacyComponentDecision>;
  public async generateComponent(
    messageHistory: ThreadMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    systemTools: SystemTools | undefined,
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
    return await decideComponent(
      this.llmClient,
      context,
      threadId,
      systemTools,
      stream,
    );
  }

  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    systemTools: SystemTools | undefined,
    stream: true,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>>;
  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    systemTools: SystemTools | undefined,
    stream?: false | undefined,
  ): Promise<LegacyComponentDecision>;
  public async hydrateComponentWithData(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
    systemTools: SystemTools | undefined,
    stream?: boolean,
  ): Promise<
    LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
  > {
    return await hydrateComponent({
      llmClient: this.llmClient,
      messageHistory,
      chosenComponent: component,
      toolResponse,
      toolCallId,
      availableComponents: undefined,
      threadId,
      stream,
      version: this.version,
      systemTools,
    });
  }

  public async runDecisionLoop(
    params: RunDecisionLoopParams,
  ): Promise<AsyncIterableIterator<LegacyComponentDecision>> {
    return runDecisionLoop(
      this.llmClient,
      params.messageHistory,
      params.availableComponents,
      params.systemTools,
      params.clientTools,
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
