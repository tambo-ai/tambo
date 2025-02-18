import { objectTemplate } from "@libretto/openai";
import { type ChatCompletionMessageParam } from "@libretto/token.js";
import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "../../model/input-context";
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
  version: "v1" | "v2" = "v1",
): Promise<ComponentDecision> {
  const {
    template: availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(context.availableComponents);
  const chatHistory = chatHistoryToParams(context.messageHistory);
  const decisionResponse = await llmClient.complete(
    objectTemplate<ChatCompletionMessageParam[]>([
      { role: "system", content: generateDecisionPrompt() },
      {
        role: "user",
        content:
          "<availableComponents>{availableComponents}</availableComponents>",
      },
      { role: "chat_history" as "user", content: "{chat_history}" },
    ]),
    "component-decision",
    { chat_history: chatHistory, ...availableComponentsArgs },
  );

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
    );
  }

  throw new Error("Invalid decision");
}

// Private function
async function handleNoComponentCase(
  llmClient: LLMClient,
  decisionResponse: any,
  context: InputContext,
  threadId: string,
  version: "v1" | "v2" = "v1",
): Promise<ComponentDecision> {
  const reasoning = decisionResponse.message.match(
    /<reasoning>(.*?)<\/reasoning>/,
  )?.[1];

  const chatHistory = chatHistoryToParams(context.messageHistory);
  const { template, args } = getNoComponentPromptTemplate(
    reasoning,
    context.availableComponents,
  );
  const noComponentResponse = await llmClient.complete(
    objectTemplate<ChatCompletionMessageParam[]>([
      { role: "system", content: template },
      { role: "chat_history" as "user", content: "{chat_history}" },
    ]),
    "no-component-decision",
    { chat_history: chatHistory, ...args },
  );

  return {
    componentName: null,
    props: null,
    message: noComponentResponse.message,
    ...(version === "v1" ? { suggestedActions: [] } : {}),
    threadId,
  };
}
