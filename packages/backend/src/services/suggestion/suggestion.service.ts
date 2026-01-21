import {
  FunctionParameters,
  getToolName,
  MessageRole,
  SUGGESTION_MODEL,
  SUGGESTION_PROVIDER,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadUserMessage,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import zodToJsonSchema from "zod-to-json-schema";
import { AvailableComponent } from "../../model";
import { buildSuggestionPrompt } from "../../prompt/suggestion-generator";
import { AISdkClient } from "../llm/ai-sdk-client";
import { LLMClient } from "../llm/llm-client";
import {
  SuggestionDecision,
  SuggestionsResponseSchema,
} from "./suggestion.types";

// Tool for Suggestion Generation
export const suggestionsResponseTool: OpenAI.Chat.Completions.ChatCompletionTool =
  {
    type: "function",
    function: {
      name: "generate_suggestions",
      description:
        "Generate suggestions for the user based on the available components and context.",
      strict: true,
      parameters: zodToJsonSchema(
        SuggestionsResponseSchema,
      ) as FunctionParameters,
    },
  };

// Public function
export async function generateSuggestions(
  llmClient: LLMClient,
  messages: ThreadMessage[],
  availableComponents: AvailableComponent[],
  count: number,
  threadId: string,
  stream?: boolean,
): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
  const suggestionMessages = buildSuggestionPrompt(
    availableComponents,
    messages,
    count,
  );

  if (stream) {
    throw new Error("Streaming is not supported yet");
  }

  // Create a suggestion-specific LLMClient which ensures faster response times by using a lighter model for suggestions
  // Use the OpenAI API key from environment variable (suggestions always use OpenAI)
  const openaiApiKey =
    process.env.OPENAI_API_KEY ?? process.env.FALLBACK_OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error(
      "OpenAI API key required for suggestions. Set OPENAI_API_KEY or FALLBACK_OPENAI_API_KEY.",
    );
  }
  const client = llmClient as unknown as {
    userId: string;
  };
  const suggestionLlmClient = new AISdkClient(
    openaiApiKey,
    SUGGESTION_MODEL,
    SUGGESTION_PROVIDER,
    llmClient.chainId,
    client.userId,
  );

  // Convert suggestion messages to ThreadMessage format
  const threadMessages: ThreadMessage[] = suggestionMessages.map((msg, i) => {
    const base = {
      id: `suggestion-${i}`,
      threadId,
      content: [{ type: "text" as const, text: msg.content }],
      createdAt: new Date(),
      componentState: {},
    };

    switch (msg.role) {
      case MessageRole.User:
        return {
          ...base,
          role: MessageRole.User,
        } satisfies ThreadUserMessage;
      case MessageRole.System:
        return {
          ...base,
          role: MessageRole.System,
        } satisfies ThreadSystemMessage;
      case MessageRole.Assistant:
        return {
          ...base,
          role: MessageRole.Assistant,
        } satisfies ThreadAssistantMessage;
      default:
        throw new Error(`Unexpected suggestion message role: ${msg.role}`);
    }
  });

  try {
    const response = await suggestionLlmClient.complete({
      messages: threadMessages,
      promptTemplateName: "suggestion-generation",
      promptTemplateParams: {},
      tools: [suggestionsResponseTool],
      tool_choice: {
        type: "function",
        function: { name: "generate_suggestions" },
      },
      // Make sure that the suggestions are not mixed up with other chains
      chainId: `${llmClient.chainId}-suggestions`,
    });

    // Handle tool call in the response
    const toolCall = response.message.tool_calls?.[0];
    if (
      toolCall?.type !== "function" ||
      getToolName(toolCall) !== "generate_suggestions"
    ) {
      console.warn("No valid tool call received from LLM");
      return {
        suggestions: [],
        message: "No suggestions could be generated at this time.",
        threadId,
      };
    }

    // Parse the tool call arguments
    const args = tryParseJsonObject(toolCall.function.arguments, false);
    if (!args) {
      console.error("Failed to parse suggestion tool call arguments");
      return {
        suggestions: [],
        message: "Invalid suggestion format received.",
        threadId,
      };
    }

    // Validate against our schema
    const parsed = SuggestionsResponseSchema.safeParse(args);
    if (!parsed.success) {
      console.error("Failed to validate suggestions:", parsed.error);
      return {
        suggestions: [],
        message: "Invalid suggestion format received.",
        threadId,
      };
    }

    return {
      suggestions: parsed.data.suggestions,
      message: parsed.data.reflection,
      threadId,
    };
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      suggestions: [],
      message: "Failed to process suggestions.",
      threadId,
    };
  }
}
