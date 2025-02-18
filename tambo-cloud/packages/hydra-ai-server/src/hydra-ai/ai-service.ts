import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";
import { decideComponent } from "./services/component/component-decision-service";
import { hydrateComponent } from "./services/component/component-hydration-service";
import { TokenJSClient } from "./services/llm/token-js-client";

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

  async chooseComponent(
    context: InputContext,
    threadId: string,
  ): Promise<ComponentDecision> {
    return decideComponent(this.llmClient, context, threadId, this.version);
  }

  async hydrateComponent(
    messageHistory: any[],
    component: any,
    toolResponse: any,
    threadId: string,
  ): Promise<ComponentDecision> {
    return hydrateComponent(
      this.llmClient,
      messageHistory,
      component,
      toolResponse,
      undefined,
      threadId,
      this.version,
    );
  }
}
