import { z } from "zod";

export interface SuggestionDecision {
  suggestions: Array<{
    title: string;
    detailedSuggestion: string;
  }>;
  message: string;
  threadId: string;
}

export const SuggestionsResponseSchema = z.object({
  reflection: z
    .string()
    .describe("Brief analysis of user's intent and relevant components"),
  suggestions: z.array(
    z.object({
      title: z
        .string()
        .describe(
          "A concise, action-oriented title that clearly states what will happen. Example: 'Apple Stock Price' or 'Sales Report'",
        ),
      detailedSuggestion: z
        .string()
        .describe(
          "A clear explanation of what the action will do. Should reference specific components or features available.",
        ),
    }),
  ),
});
