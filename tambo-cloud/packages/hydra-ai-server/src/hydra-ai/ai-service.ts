import { ComponentDecision } from "./model/component-choice";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";
import { ComponentDecisionService } from "./services/component/component-decision-service";
import { ComponentHydrationService } from "./services/component/component-hydration-service";
import { TokenJSClient } from "./services/llm/token-js-client";
import { ResponseParserService } from "./services/parser/response-parser-service";
import { PromptService } from "./services/prompt/prompt-service";
import { ToolService } from "./services/tool/tool-service";

export default class AIService {
  private llmClient: TokenJSClient;
  private decisionService: ComponentDecisionService;
  private hydrationService: ComponentHydrationService;
  private promptService: PromptService;
  private toolService: ToolService;
  private parserService: ResponseParserService;

  constructor(
    openAiKey: string,
    model: string = "gpt-4o",
    provider: Provider = "openai",
  ) {
    this.llmClient = new TokenJSClient(openAiKey, model, provider);
    this.promptService = new PromptService();
    this.toolService = new ToolService();
    this.parserService = new ResponseParserService();
    this.hydrationService = new ComponentHydrationService(
      this.llmClient,
      this.promptService,
      this.parserService,
      this.toolService,
    );
    this.decisionService = new ComponentDecisionService(
      this.llmClient,
      this.promptService,
      this.parserService,
      this.hydrationService,
    );
  }

  async chooseComponent(context: InputContext): Promise<ComponentDecision> {
    return this.decisionService.decideComponent(context);
  }

  async hydrateComponent(
    messageHistory: any[],
    component: any,
    toolResponse?: any,
    availableComponents?: any,
  ): Promise<ComponentDecision> {
    return this.hydrationService.hydrateComponent(
      messageHistory,
      component,
      toolResponse,
      availableComponents,
    );
  }
}
