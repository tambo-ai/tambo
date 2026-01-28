"use client";

import { cn } from "@/lib/utils";
import type { Suggestion } from "@tambo-ai/react";
import { useTamboSuggestions } from "@tambo-ai/react";
import * as React from "react";

export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
}

export const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(({ className, maxSuggestions = 2, ...props }, ref) => {
  const {
    suggestions,
    accept: acceptSuggestion,
    generateResult,
  } = useTamboSuggestions({
    maxSuggestions,
  });
  const [error, setError] = React.useState<string | null>(null);

  if (suggestions.length === 0) {
    return null;
  }

  const handleAccept = async (suggestion: Suggestion) => {
    try {
      setError(null);
      await acceptSuggestion({ suggestion });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept suggestion";
      setError(message);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "border-t border-border/50 px-4 py-3 bg-background/95",
        className,
      )}
      {...props}
    >
      {error && (
        <div className="mb-3 p-2 text-xs text-destructive bg-destructive/10 rounded">
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground font-semibold uppercase mb-3">
        Suggestions
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {suggestions.slice(0, maxSuggestions).map((suggestion, i) => (
          <button
            key={suggestion.id || i}
            onClick={() => handleAccept(suggestion)}
            disabled={generateResult.isPending}
            className={cn(
              "text-left text-xs px-2.5 py-2 rounded-md border border-input transition-colors",
              "hover:border-primary/50 hover:bg-muted disabled:opacity-50",
              "group relative overflow-hidden",
            )}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span
              className="font-medium relative block truncate"
              title={
                suggestion.detailedSuggestion ||
                suggestion.title ||
                "Suggestion"
              }
            >
              {suggestion.title ||
                suggestion.detailedSuggestion ||
                "Suggestion"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

MessageSuggestions.displayName = "MessageSuggestions";
