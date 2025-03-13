import { objectTemplate } from "@libretto/openai";
import { ChatCompletionMessageParam } from "@libretto/token.js";
import { ComponentDecision } from "@tambo-ai-cloud/core";
import { parse } from "partial-json";
import { z } from "zod";
import { ChatMessage } from "../../model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
  ToolResponseBody,
} from "../../model/component-metadata";
import { OpenAIResponse } from "../../model/openai-response";
import { CompleteParams, LLMClient } from "../llm/llm-client";
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
  toolResponse: ToolResponseBody | undefined,
  availableComponents: AvailableComponents | undefined,
  threadId: string,
  stream?: boolean,
  version: "v1" | "v2" = "v1",
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
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
    template: _availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(
    availableComponents || { [chosenComponent.name]: chosenComponent },
  );

  const completeOptions: CompleteParams = {
    messages: objectTemplate([
      { role: "system", content: template },
      { role: "chat_history", content: "{chat_history}" },
      {
        role: "user",
        content: `<componentName>{chosenComponentName}</componentName>
        <componentDescription>{chosenComponentDescription}</componentDescription>
        <expectedProps>{chosenComponentProps}</expectedProps>
        ${toolResponseString ? `<toolResponse>{toolResponseString}</toolResponse>` : ""}`,
      },
    ] as ChatCompletionMessageParam[]),
    promptTemplateName: toolResponseString
      ? "component-hydration-with-tool-response"
      : "component-hydration",
    promptTemplateParams: {
      chat_history: chatHistory,
      chosenComponentName: chosenComponent.name,
      chosenComponentDescription,
      chosenComponentProps,
      toolResponseString,
      ...componentHydrationArgs,
      ...availableComponentsArgs,
    },
    tools,
    jsonMode: true,
  };

  if (stream) {
    const responseStream = await llmClient.complete({
      ...completeOptions,
      stream: true,
    });

    return handleComponentHydrationStream(
      responseStream,
      chosenComponent.name,
      threadId,
      version,
    );
  }

  const generateComponentResponse = await llmClient.complete(completeOptions);

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

async function* handleComponentHydrationStream(
  responseStream: AsyncIterableIterator<OpenAIResponse>,
  componentName: string,
  threadId: string,
  version: "v1" | "v2" = "v1",
): AsyncIterableIterator<ComponentDecision> {
  const initialDecision: ComponentDecision = {
    componentName,
    props: null,
    message: "",
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    toolCallRequest: undefined,
    threadId,
  };

  let accumulatedDecision = initialDecision;

  for await (const chunk of responseStream) {
    try {
      const message = chunk.message.length > 0 ? chunk.message : "{}";
      const parsedChunk = {
        ...parse(message),
        toolCallRequest: chunk.toolCallRequest,
      };

      accumulatedDecision = {
        ...accumulatedDecision,
        ...parsedChunk,
        componentName,
        threadId,
      };

      yield accumulatedDecision;
    } catch (e) {
      console.error("Error parsing stream chunk:", e);
    }
  }
}
