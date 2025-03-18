import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
} from "@tambo-ai-cloud/core";
import { InputContext } from "../../model/input-context";
import { OpenAIResponse } from "../../model/openai-response";
import { LLMClient } from "../llm/llm-client";
import { threadMessagesToChatHistory } from "../llm/threadMessagesToChatHistory";
import {
  decideComponentTool,
  generateAvailableComponentsList,
  generateDecisionPrompt,
  getNoComponentPromptTemplate,
} from "../prompt/prompt-service";
import { hydrateComponent } from "./component-hydration-service";

// Public function
export async function decideComponent(
  llmClient: LLMClient,
  context: InputContext,
  threadId: string,
  stream?: boolean,
): Promise<
  LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
> {
  const availableComponents = generateAvailableComponentsList(
    context.availableComponents,
  );
  const { template: systemPrompt, args: availableComponentsArgs } =
    generateDecisionPrompt(availableComponents);
  const chatHistory = threadMessagesToChatHistory(context.messageHistory);
  const prompt = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);
  const decisionResponse = await llmClient.complete({
    messages: prompt,
    tool_choice: "required",
    tools: [decideComponentTool],
    promptTemplateName: "component-decision",
    promptTemplateParams: {
      chat_history: chatHistory,
      ...availableComponentsArgs,
    },
  });

  const shouldGenerate = decisionResponse.toolCallRequest?.parameters.find(
    ({ parameterName }) => parameterName === "decision",
  )?.parameterValue;

  const componentName = decisionResponse.toolCallRequest?.parameters.find(
    ({ parameterName }) => parameterName === "component",
  )?.parameterValue;

  if (!shouldGenerate) {
    return await handleNoComponentCase(
      llmClient,
      decisionResponse.toolCallRequest?.parameters.find(
        ({ parameterName }) => parameterName === "reasoning",
      )?.parameterValue ?? decisionResponse.message,
      context,
      threadId,
      stream,
    );
  } else if (shouldGenerate && componentName) {
    const component = context.availableComponents[componentName];
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    return await hydrateComponent({
      llmClient,
      messageHistory: context.messageHistory,
      chosenComponent: component,
      toolResponse: undefined,
      toolCallId: undefined,
      availableComponents: context.availableComponents,
      threadId,
      stream,
    });
  }

  throw new Error(`Invalid decision: ${decisionResponse.message}`);
}

// Private function
async function handleNoComponentCase(
  llmClient: LLMClient,
  reasoning: string,
  context: InputContext,
  threadId: string,
  stream?: boolean,
  version: "v1" | "v2" = "v1",
): Promise<
  LegacyComponentDecision | AsyncIterableIterator<LegacyComponentDecision>
> {
  const chatHistory = threadMessagesToChatHistory(context.messageHistory);
  const { template, args } = getNoComponentPromptTemplate(
    reasoning ?? "No reasoning provided",
    context.availableComponents,
  );

  const completeOptions = {
    messages: objectTemplate<ChatCompletionMessageParam[]>([
      { role: "system", content: template },
      { role: "chat_history" as "user", content: "{chat_history}" },
    ]),
    promptTemplateName: "no-component-decision",
    promptTemplateParams: { chat_history: chatHistory, ...args },
  };

  if (stream) {
    const responseStream = await llmClient.complete({
      ...completeOptions,
      stream: true,
    });

    return handleNoComponentStream(responseStream, threadId, version);
  }

  const noComponentResponse = await llmClient.complete(completeOptions);

  return {
    componentName: null,
    props: null,
    message: noComponentResponse.message,
    ...(version === "v1" ? { suggestedActions: [] } : {}),
  };
}

async function* handleNoComponentStream(
  responseStream: AsyncIterableIterator<OpenAIResponse>,
  threadId: string,
  version: "v1" | "v2" = "v1",
): AsyncIterableIterator<LegacyComponentDecision> {
  const accumulatedDecision: LegacyComponentDecision = {
    componentName: null,
    props: null,
    message: "",
    ...(version === "v1" ? { suggestedActions: [] } : {}),
  };

  for await (const chunk of responseStream) {
    accumulatedDecision.message = chunk.message;
    yield accumulatedDecision;
  }
}
