import { ComponentDecision } from "@use-hydra-ai/core";
import { ChatMessage } from "../../model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
} from "../../model/component-metadata";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { parseAndValidate } from "../parser/response-parser-service";
import { generateComponentHydrationPrompt } from "../prompt/prompt-service";
import { schema as promptSchema } from "../prompt/schemas";
import { convertMetadataToTools } from "../tool/tool-service";

// Public function
export async function hydrateComponent(
  llmClient: LLMClient,
  messageHistory: ChatMessage[],
  chosenComponent: AvailableComponent,
  toolResponse: any | undefined,
  availableComponents: AvailableComponents | undefined,
  threadId: string,
): Promise<ComponentDecision> {
  //only define tools if we don't have a tool response
  const tools = toolResponse
    ? undefined
    : convertMetadataToTools(chosenComponent.contextTools);

  const generateComponentResponse = await llmClient.complete(
    [
      {
        role: "system",
        content: generateComponentHydrationPrompt(
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
    threadId,
  };

  if (!componentDecision.toolCallRequest) {
    const parsedData = await parseAndValidate(
      promptSchema,
      generateComponentResponse.message,
    );

    componentDecision.componentName = parsedData.componentName;
    componentDecision.props = parsedData.props;
    componentDecision.message = parsedData.message;
    componentDecision.suggestedActions = parsedData.suggestedActions || [];
  }

  return componentDecision;
}
