import { objectTemplate } from "@libretto/openai";
import { type ChatCompletionMessageParam } from "@libretto/token.js";
import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "../../model/input-context";
import { OpenAIResponse } from "../../model/openai-response";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import {
  generateDecisionPrompt,
  getAvailableComponentsPromptTemplate,
  getNoComponentPromptTemplate,
} from "../prompt/prompt-service";
import { hydrateComponent } from "./component-hydration-service";

// Public function
export async function decideComponent(
  llmClient: LLMClient,
  context: InputContext,
  threadId: string,
  stream?: boolean,
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
  const {
    template: availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(context.availableComponents);
  const chatHistory = chatHistoryToParams(context.messageHistory);
  const decisionResponse = await llmClient.complete({
    messages: objectTemplate<ChatCompletionMessageParam[]>([
      { role: "system", content: generateDecisionPrompt() },
      {
        role: "user",
        content:
          "<availableComponents>{availableComponents}</availableComponents>",
      },
      { role: "chat_history" as "user", content: "{chat_history}" },
    ]),
    promptTemplateName: "component-decision",
    promptTemplateParams: {
      chat_history: chatHistory,
      ...availableComponentsArgs,
    },
  });

  const shouldGenerate = decisionResponse.message.match(
    /<decision>(.*?)<\/decision>/,
  )?.[1];

  const componentName = decisionResponse.message.match(
    /<component>(.*?)<\/component>/,
  )?.[1];

  if (shouldGenerate === "false") {
    return handleNoComponentCase(
      llmClient,
      decisionResponse,
      context,
      threadId,
      stream,
    );
  } else if (shouldGenerate === "true" && componentName) {
    const component = context.availableComponents[componentName];
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    return hydrateComponent(
      llmClient,
      context.messageHistory,
      component,
      undefined,
      context.availableComponents,
      threadId,
      stream,
    );
  }

  throw new Error("Invalid decision");
}

// Private function
async function handleNoComponentCase(
  llmClient: LLMClient,
  decisionResponse: OpenAIResponse,
  context: InputContext,
  threadId: string,
  stream?: boolean,
  version: "v1" | "v2" = "v1",
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
  const reasoning = decisionResponse.message.match(
    /<reasoning>(.*?)<\/reasoning>/,
  )?.[1];

  const chatHistory = chatHistoryToParams(context.messageHistory);
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
    threadId,
  };
}

async function* handleNoComponentStream(
  responseStream: AsyncIterableIterator<OpenAIResponse>,
  threadId: string,
  version: "v1" | "v2" = "v1",
): AsyncIterableIterator<ComponentDecision> {
  const accumulatedDecision: ComponentDecision = {
    componentName: null,
    props: null,
    message: "",
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    threadId,
  };

  for await (const chunk of responseStream) {
    accumulatedDecision.message = chunk.message;
    yield accumulatedDecision;
  }
}
