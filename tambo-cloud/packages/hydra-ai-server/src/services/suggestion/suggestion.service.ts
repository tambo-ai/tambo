import { ThreadMessage } from "@tambo-ai-cloud/core";
import { InputContextAsArray } from "../../model/input-context";
import { buildSuggestionPrompt } from "../../prompt/suggestion-generator";
import { LLMClient } from "../llm/llm-client";
import {
  SuggestionDecision,
  SuggestionsResponseSchema,
} from "./suggestion.types";

type SuggestionsContext = {
  messageHistory: ThreadMessage[];
  availableComponents: InputContextAsArray["availableComponents"];
  threadId: string;
};

// Public function
export async function generateSuggestions(
  llmClient: LLMClient,
  context: SuggestionsContext,
  count: number,
  threadId: string,
  stream?: boolean,
): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
  const components = context.availableComponents ?? [];
  const messages = buildSuggestionPrompt(
    components,
    context.messageHistory,
    count,
  );

  if (stream) {
    throw new Error("Streaming is not supported yet");
  }

  try {
    const response = await llmClient.complete({
      messages,
      promptTemplateName: "suggestion-generation",
      promptTemplateParams: {},
      zodResponseFormat: SuggestionsResponseSchema,
    });

    // Add validation for response message
    if (!response?.message) {
      console.warn("No response message received from LLM");
      return {
        suggestions: [],
        message: "No suggestions could be generated at this time.",
        threadId,
      };
    }

    // Use safeParse for better error handling
    const parsed = SuggestionsResponseSchema.safeParse(
      JSON.parse(response.message),
    );
    if (!parsed.success) {
      console.error("Failed to parse suggestions:", parsed.error);
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
