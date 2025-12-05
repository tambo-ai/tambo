import { FunctionParameters, ThreadMessage } from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod/v3";
import { LLMClient, LLMResponse } from "../llm/llm-client";

const nameLengthLimit = 30;

const ThreadNameSchema = z.object({
  name: z.string().max(nameLengthLimit)
    .describe(`The name to use for the thread.
      It should be less than ${nameLengthLimit} characters.`),
});

export const threadNameTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_thread_name",
    description: `Generate a short name for the thread which summarizes the conversation and can be used to identify the thread. When completed, the name should be no more than ${nameLengthLimit} characters.`,
    strict: true,
    parameters: zodToJsonSchema(ThreadNameSchema) as FunctionParameters,
  },
};

export async function generateThreadName(
  llmClient: LLMClient,
  messages: ThreadMessage[],
) {
  const response = await llmClient.complete({
    messages,
    promptTemplateName: "thread-name-generation",
    promptTemplateParams: {},
    tools: [threadNameTool],
    tool_choice: {
      type: "function",
      function: {
        name: "generate_thread_name",
      },
    },
    stream: false,
  });

  return extractThreadName(response);
}

function extractThreadName(response: LLMResponse) {
  const toolCall = response.message.tool_calls?.[0];
  if (toolCall?.type !== "function") {
    throw new Error("Thread name could not be generated (no tool call)");
  }
  const extractedName = toolCall.function.arguments;
  if (!extractedName) {
    throw new Error("Thread name could not be generated");
  }
  try {
    const parsedName = ThreadNameSchema.parse(JSON.parse(extractedName));
    return parsedName.name;
  } catch (error) {
    console.error(error);
    throw new Error("Thread name could not be parsed from response");
  }
}
