import { ComponentDecision } from "../../model/component-choice";
import { InputContext } from "../../model/input-context";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { PromptService } from "../prompt/prompt-service";
import { ComponentHydrationService } from "./component-hydration-service";

export class ComponentDecisionService {
  constructor(
    private llmClient: LLMClient,
    private promptService: PromptService,
    private hydrationService: ComponentHydrationService,
  ) {}

  async decideComponent(
    context: InputContext,
    threadId: string,
  ): Promise<ComponentDecision> {
    const decisionResponse = await this.llmClient.complete([
      {
        role: "system",
        content: this.promptService.generateDecisionPrompt(),
      },
      {
        role: "user",
        content: `<availableComponents>
        ${this.promptService.generateAvailableComponentsPrompt(context.availableComponents)}
        </availableComponents>`,
      },
      ...chatHistoryToParams(context.messageHistory),
    ]);

    const shouldGenerate = decisionResponse.message.match(
      /<decision>(.*?)<\/decision>/,
    )?.[1];

    const componentName = decisionResponse.message.match(
      /<component>(.*?)<\/component>/,
    )?.[1];

    if (shouldGenerate === "false") {
      return this.handleNoComponentCase(decisionResponse, context, threadId);
    } else if (shouldGenerate === "true" && componentName) {
      const component = context.availableComponents[componentName];
      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }
      return this.hydrationService.hydrateComponent(
        context.messageHistory,
        component,
        undefined,
        context.availableComponents,
        threadId,
      );
    }

    throw new Error("Invalid decision");
  }

  private async handleNoComponentCase(
    decisionResponse: any,
    context: InputContext,
    threadId: string,
  ): Promise<ComponentDecision> {
    const reasoning = decisionResponse.message.match(
      /<reasoning>(.*?)<\/reasoning>/,
    )?.[1];

    const noComponentResponse = await this.llmClient.complete([
      {
        role: "system",
        content: this.promptService.generateNoComponentPrompt(
          reasoning,
          context.availableComponents,
        ),
      },
      ...chatHistoryToParams(context.messageHistory),
    ]);

    return {
      componentName: null,
      props: null,
      message: noComponentResponse.message,
      suggestedActions: [],
      threadId,
    };
  }
}
