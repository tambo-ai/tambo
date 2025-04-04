import { LegacyComponentDecision, ThreadMessage } from "@tambo-ai-cloud/core";
import {
  AvailableComponent,
  InputContext,
  InputContextAsArray,
  ToolResponseBody,
} from "../model";
import { Provider } from "../model/providers";
import { decideComponent } from "./component/component-decision-service";
import { hydrateComponent } from "./component/component-hydration-service";
import { TokenJSClient } from "./llm/token-js-client";
import { generateSuggestions } from "./suggestion/suggestion.service";
import { SuggestionDecision } from "./suggestion/suggestion.types";

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
  ): Promise<
    LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
  > {
    return await decideComponent(this.llmClient, context, threadId, stream);
  }

  async hydrateComponent(
    messageHistory: ThreadMessage[],
    component: AvailableComponent,
    toolResponse: ToolResponseBody,
    toolCallId: string | undefined,
    threadId: string,
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
    });
  }
}
