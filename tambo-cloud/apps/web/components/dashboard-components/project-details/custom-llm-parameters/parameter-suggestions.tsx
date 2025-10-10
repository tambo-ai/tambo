import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { LlmParameterUIType } from "@tambo-ai-cloud/core";
import { Plus } from "lucide-react";
import { PARAMETER_SUGGESTIONS } from "./types";

/**
 * ParameterSuggestions Component
 *
 * Displays clickable parameter suggestions for a specific LLM provider.
 * Each suggestion appears as a button that users can click to quickly add
 * common LLM parameters to their configuration.
 */
interface ParameterSuggestionsProps {
  providerName: string;
  suggestions: typeof PARAMETER_SUGGESTIONS;
  onApply: (suggestion: { key: string; type: LlmParameterUIType }) => void;
}

export function ParameterSuggestions({
  providerName,
  suggestions,
  onApply,
}: ParameterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-4">
      <Label className="text-xs text-muted-foreground mb-2 block">
        Common parameters for {providerName}:
      </Label>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {suggestions.map((s) => (
            <Tooltip key={s.key} content={s.description}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApply(s)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {s.key}
              </Button>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
