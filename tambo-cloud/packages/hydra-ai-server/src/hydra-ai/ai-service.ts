import { ComponentDecision } from "@use-hydra-ai/core";
import {
  AvailableComponent,
  ChatMessage,
  InputContext,
  InputContextAsArray,
  ToolResponseBody,
} from "./model";
import { Provider } from "./model/providers";
import { decideComponent } from "./services/component/component-decision-service";
import { hydrateComponent } from "./services/component/component-hydration-service";
import { TokenJSClient } from "./services/llm/token-js-client";
import { generateSuggestions } from "./services/suggestion/suggestion.service";
import { SuggestionDecision } from "./services/suggestion/suggestion.types";

export default class AIService {
  private llmClient: TokenJSClient;
  private version: "v1" | "v2";

  constructor(
    openAiKey: string,
    model: string = "gpt-4o-mini",
    provider: Provider = "openai",
    chainId: string,
    version: "v1" | "v2" = "v1",
  ) {
    this.llmClient = new TokenJSClient(openAiKey, model, provider, chainId);
    this.version = version;
  }

  async generateSuggestions(
    context: InputContextAsArray,
    count: number,
    threadId: string,
    stream?: boolean,
  ): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
    return await generateSuggestions(
      this.llmClient,
      context,
      count,
      threadId,
      stream,
    );
  }

  async chooseComponent(
    context: InputContext,
    threadId: string,
    stream?: boolean,
  ): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
    return await decideComponent(this.llmClient, context, threadId, stream);
  }

  async hydrateComponent(
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    threadId: string,
    stream?: boolean,
  ): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
    return await hydrateComponent(
      this.llmClient,
      messageHistory,
      component,
      toolResponse,
      undefined,
      threadId,
      stream,
      this.version,
    );
  }
}
