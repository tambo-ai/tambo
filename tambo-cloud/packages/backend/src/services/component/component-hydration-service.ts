import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { parse } from "partial-json";
import { z } from "zod";
import {
  AvailableComponent,
  AvailableComponents,
  ToolResponseBody,
} from "../../model/component-metadata";
import { getAvailableComponentsPromptTemplate } from "../../prompt/component-formatting";
import { getComponentHydrationPromptTemplate } from "../../prompt/component-hydration";
import { schemaV1, schemaV2 } from "../../prompt/schemas";
import { SystemTools } from "../../systemTools";
import { parseAndValidate } from "../../util/response-parsing";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import {
  CompleteParams,
  getLLMResponseMessage,
  getLLMResponseToolCallId,
  getLLMResponseToolCallRequest,
  LLMClient,
  LLMResponse,
} from "../llm/llm-client";
import { convertMetadataToTools } from "../tool/tool-service";

// Public function
export async function hydrateComponent({
  llmClient,
  messageHistory,
  chosenComponent,
  toolResponse,
  toolCallId: _toolCallId, // We may not have a tool call id if the tool call is not from the user
  availableComponents,
  threadId,
  stream,
  version = "v1",
  systemTools,
}: {
  llmClient: LLMClient;
  messageHistory: ThreadMessage[];
  chosenComponent: AvailableComponent;
  toolResponse: ToolResponseBody | undefined;
  toolCallId?: string;
  availableComponents: AvailableComponents | undefined;
  threadId: string;
  stream?: boolean;
  version?: "v1" | "v2";
  systemTools?: SystemTools;
}): Promise<
  LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
> {
  const leadingMessages = messageHistory.slice(0, -1);
  const userMessage = messageHistory[messageHistory.length - 1];

  if (!["user", "tool"].includes(userMessage.role)) {
    throw new Error(
      `Last message in message history must be a user/tool message, instead I got ${userMessage.role}: ${JSON.stringify(
        userMessage,
      )}`,
    );
  }

  //only define tools if we don't have a tool response
  const userTools = toolResponse
    ? []
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
  const chatHistory = threadMessagesToChatHistory(leadingMessages);
  const {
    template: _availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(
    availableComponents || { [chosenComponent.name]: chosenComponent },
  );

  const userMessageWithInstructions: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `
Use the following component and tool results to hydrate the component:
<componentName>${chosenComponent.name}</componentName>
<componentDescription>${chosenComponentDescription}</componentDescription>
<expectedProps>${chosenComponentProps}</expectedProps>

      ${toolResponseString ? `<toolResponse>${toolResponseString}</toolResponse>` : ""}

To respond to the user's message:
----
`,
        },
        ...userMessage.content,
      ],
    },
  ];

  const messages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: template },
    { role: "chat_history", content: "{chat_history}" },
    { role: "chat_history", content: "{userMessageWithInstructions}" },
  ] as ChatCompletionMessageParam[]);

  const completeOptions: CompleteParams = {
    messages: messages,
    promptTemplateName: toolResponseString
      ? "component-hydration-with-tool-response"
      : "component-hydration",
    promptTemplateParams: {
      chat_history: chatHistory,
      chosenComponentName: chosenComponent.name,
      chosenComponentDescription,
      chosenComponentProps,
      toolResponseString,
      userMessageWithInstructions,
      ...componentHydrationArgs,
      ...availableComponentsArgs,
    },
    tools: [...userTools, ...(systemTools?.tools ?? [])],
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

  const componentDecision: LegacyComponentDecision = {
    reasoning: "",
    message: "Fetching additional data",
    componentName: chosenComponent.name,
    props: null,
    componentState: null, // TOOD: remove when optional
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    toolCallRequest: getLLMResponseToolCallRequest(generateComponentResponse),
  };

  if (!componentDecision.toolCallRequest) {
    const parsedData = (await parseAndValidate(
      version === "v1" ? schemaV1 : schemaV2,
      getLLMResponseMessage(generateComponentResponse),
    )) as z.infer<typeof schemaV1> | z.infer<typeof schemaV2>;

    componentDecision.componentName = parsedData.componentName;
    componentDecision.props = parsedData.props;
    componentDecision.message = parsedData.message;
    componentDecision.componentState = parsedData.componentState ?? null;
    if (version === "v1" && "suggestedActions" in parsedData) {
      componentDecision.suggestedActions = parsedData.suggestedActions || [];
    }
  }

  return componentDecision;
}

async function* handleComponentHydrationStream(
  responseStream: AsyncIterableIterator<Partial<LLMResponse>>,
  componentName: string,
  threadId: string,
  version: "v1" | "v2" = "v1",
): AsyncIterableIterator<LegacyComponentDecision> {
  const initialDecision: LegacyComponentDecision = {
    reasoning: "",
    componentName,
    props: null,
    message: "",
    componentState: null, // TOOD: remove when optional
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    toolCallRequest: undefined,
    toolCallId: undefined,
  };

  let accumulatedDecision = initialDecision;

  for await (const chunk of responseStream) {
    try {
      const message = getLLMResponseMessage(chunk) || "{}";
      const parsedChunk = {
        ...parse(message),
        toolCallRequest: getLLMResponseToolCallRequest(chunk),
        toolCallId: getLLMResponseToolCallId(chunk),
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
