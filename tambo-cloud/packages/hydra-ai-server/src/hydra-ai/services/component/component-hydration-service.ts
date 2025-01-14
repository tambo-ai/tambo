import { ChatMessage } from "../../model/chat-message";
import { ComponentDecision } from "../../model/component-choice";
import {
  AvailableComponent,
  AvailableComponents,
} from "../../model/component-metadata";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { ResponseParserService } from "../parser/response-parser-service";
import { PromptService } from "../prompt/prompt-service";
import { ToolService } from "../tool/tool-service";

export class ComponentHydrationService {
  constructor(
    private llmClient: LLMClient,
    private promptService: PromptService,
    private parserService: ResponseParserService,
    private toolService: ToolService,
  ) {}

  async hydrateComponent(
    messageHistory: ChatMessage[],
    chosenComponent: AvailableComponent,
    toolResponse?: any,
    availableComponents?: AvailableComponents,
  ): Promise<ComponentDecision> {
    //only define tools if we don't have a tool response
    const tools = toolResponse
      ? undefined
      : this.toolService.convertMetadataToTools(chosenComponent.contextTools);

    const generateComponentResponse = await this.llmClient.complete(
      [
        {
          role: "system",
          content: this.promptService.generateComponentHydrationPrompt(
            toolResponse,
            availableComponents || { [chosenComponent.name]: chosenComponent },
          ),
        },
        ...chatHistoryToParams(messageHistory),
        {
          role: "user",
          content: `<componentName>${chosenComponent.name}</componentName>
          <componentDescription>${JSON.stringify(chosenComponent.description)}</componentDescription>
          <expectedProps>${JSON.stringify(chosenComponent.props)}</expectedProps>
          ${toolResponse ? `<toolResponse>${JSON.stringify(toolResponse)}</toolResponse>` : ""}`,
        },
      ],
      tools,
      true,
    );

    const componentDecision: ComponentDecision = {
      message: "Fetching additional data",
      componentName: chosenComponent.name,
      props: null,
      suggestedActions: [],
      toolCallRequest: generateComponentResponse.toolCallRequest,
    };

    if (!componentDecision.toolCallRequest) {
      const parsedData = await this.parserService.parseAndValidate(
        this.promptService.schema,
        generateComponentResponse.message,
      );

      componentDecision.componentName = parsedData.componentName;
      componentDecision.props = parsedData.props;
      componentDecision.message = parsedData.message;
      componentDecision.suggestedActions = parsedData.suggestedActions || [];
    }

    return componentDecision;
  }
}
