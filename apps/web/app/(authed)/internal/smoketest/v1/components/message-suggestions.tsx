import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@tambo-ai/react/v1";
import { useTamboV1, useTamboV1Suggestions } from "@tambo-ai/react/v1";
import { useCallback } from "react";

interface MessageSuggestionsProps {
  maxSuggestions?: number;
}

export function MessageSuggestions({
  maxSuggestions = 3,
}: MessageSuggestionsProps) {
  const { currentThreadId } = useTamboV1();
  const {
    suggestions,
    isAccepting,
    isGenerating,
    error,
    accept,
    selectedSuggestionId,
  } = useTamboV1Suggestions(currentThreadId ?? undefined, { maxSuggestions });

  const handleAccept = useCallback(
    async (suggestion: Suggestion) => {
      try {
        await accept({ suggestion, shouldSubmit: false }); // True is auto-submit
      } catch (err) {
        console.error("Error accepting suggestion:", err);
      }
    },
    [accept],
  );

  if (suggestions.length === 0 && !isGenerating) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isGenerating ? (
          <p className="text-sm text-muted-foreground">
            Loading suggestions...
          </p>
        ) : (
          suggestions.map((suggestion) => {
            const isSelected = selectedSuggestionId === suggestion.id;
            return (
              <Button
                key={suggestion.id}
                variant={isSelected ? "default" : "secondary"}
                size="sm"
                onClick={async () => await handleAccept(suggestion)}
                disabled={isAccepting}
                className={cn(
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  "transition-all",
                )}
                title={suggestion.detailedSuggestion}
              >
                {suggestion.title}
              </Button>
            );
          })
        )}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>
    </div>
  );
}
