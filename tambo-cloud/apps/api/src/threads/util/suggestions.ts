import { schema } from "@tambo-ai-cloud/db";
import { SuggestionDto } from "../dto/suggestion.dto";

export function mapSuggestionToDto(
  suggestion: schema.DBSuggestion,
): SuggestionDto {
  return {
    id: suggestion.id,
    messageId: suggestion.messageId,
    title: suggestion.title,
    detailedSuggestion: suggestion.detailedSuggestion,
  };
}
