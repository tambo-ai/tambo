import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@hydra-ai/react";
import { useTamboSuggestions } from "@hydra-ai/react";
import { useCallback } from "react";

interface MessageSuggestionsProps {
  maxSuggestions?: number;
}

export function MessageSuggestions({
  maxSuggestions = 3,
}: MessageSuggestionsProps) {
  const {
    suggestions,
    isLoading,
    isAccepting,
    error,
    accept,
    selectedSuggestionId,
  } = useTamboSuggestions({ maxSuggestions });

  const handleAccept = useCallback(
    async (suggestion: Suggestion) => {
      try {
        await accept(suggestion, false); // True is auto-submit
      } catch (error) {
        console.error("Error accepting suggestion:", error);
      }
    },
    [accept],
  );

  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
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
                onClick={() => handleAccept(suggestion)}
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
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
