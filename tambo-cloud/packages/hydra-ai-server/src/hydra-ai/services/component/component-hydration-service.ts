import { objectTemplate } from "@libretto/openai";
import { ChatCompletionMessageParam } from "@libretto/token.js";
import { ComponentDecision } from "@use-hydra-ai/core";
import { z } from "zod";
import { ChatMessage } from "../../model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
} from "../../model/component-metadata";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { parseAndValidate } from "../parser/response-parser-service";
import {
  getAvailableComponentsPromptTemplate,
  getComponentHydrationPromptTemplate,
} from "../prompt/prompt-service";
import { schemaV1, schemaV2 } from "../prompt/schemas";
import { convertMetadataToTools } from "../tool/tool-service";

// Public function
export async function hydrateComponent(
  llmClient: LLMClient,
  messageHistory: ChatMessage[],
  chosenComponent: AvailableComponent,
  toolResponse: any | undefined,
  availableComponents: AvailableComponents | undefined,
  threadId: string,
  version: "v1" | "v2" = "v1",
): Promise<ComponentDecision> {
  //only define tools if we don't have a tool response
  const tools = toolResponse
    ? undefined
    : convertMetadataToTools(chosenComponent.contextTools);

  const chosenComponentDescription = JSON.stringify(
    chosenComponent.description,
  );
  const chosenComponentProps = JSON.stringify(chosenComponent.props);
  const toolResponseString = toolResponse ? JSON.stringify(toolResponse) : "";
  const { template, args: componentHydrationArgs } =
    getComponentHydrationPromptTemplate(
      toolResponse,
      availableComponents || { [chosenComponent.name]: chosenComponent },
    );
  const chatHistory = chatHistoryToParams(messageHistory);
  const {
    template: availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(
    availableComponents || { [chosenComponent.name]: chosenComponent },
  );
  const generateComponentResponse = await llmClient.complete(
    objectTemplate([
      { role: "system", content: template },
      { role: "chat_history", content: "{chatHistory}" },
      {
        role: "user",
        content: `<componentName>{chosenComponentName}</componentName>
        <componentDescription>{chosenComponentDescription}</componentDescription>
        <expectedProps>{chosenComponentProps}</expectedProps>
        ${toolResponseString ? `<toolResponse>{toolResponseString}</toolResponse>` : ""}`,
      },
    ] as ChatCompletionMessageParam[]),
    toolResponseString
      ? "component-hydration-with-tool-response"
      : "component-hydration",
    {
      chatHistory,
      chosenComponentName: chosenComponent.name,
      chosenComponentDescription,
      chosenComponentProps,
      toolResponseString,
      ...componentHydrationArgs,
      ...availableComponentsArgs,
    },
    tools,
    true,
  );

  const componentDecision: ComponentDecision = {
    message: "Fetching additional data",
    componentName: chosenComponent.name,
    props: null,
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    toolCallRequest: generateComponentResponse.toolCallRequest,
    threadId,
  };

  if (!componentDecision.toolCallRequest) {
    const parsedData = (await parseAndValidate(
      version === "v1" ? schemaV1 : schemaV2,
      generateComponentResponse.message,
    )) as z.infer<typeof schemaV1> | z.infer<typeof schemaV2>;

    componentDecision.componentName = parsedData.componentName;
    componentDecision.props = parsedData.props;
    componentDecision.message = parsedData.message;
    if (version === "v1" && "suggestedActions" in parsedData) {
      componentDecision.suggestedActions = parsedData.suggestedActions || [];
    }
  }

  return componentDecision;
}
