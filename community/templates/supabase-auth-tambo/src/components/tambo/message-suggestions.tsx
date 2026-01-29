"use client";

import { cn } from "@/lib/utils";
import type { Suggestion } from "@tambo-ai/react";
import { useTamboSuggestions } from "@tambo-ai/react";
import { Sparkles } from "lucide-react";
import * as React from "react";

export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
}

export const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(({ className, maxSuggestions = 3, ...props }, ref) => {
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
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <p className="text-xs font-medium text-slate-600">Suggested prompts</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, maxSuggestions).map((suggestion, i) => (
          <button
            key={suggestion.id || i}
            onClick={() => handleAccept(suggestion)}
            disabled={generateResult.isPending}
            className={cn(
              "text-left text-sm px-4 py-2.5 rounded-lg border border-slate-200 bg-white transition-all",
              "hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
              "group relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300",
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span
              className="font-medium text-slate-700 relative block"
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
            {suggestion.detailedSuggestion && suggestion.title && (
              <span className="text-xs text-slate-500 mt-1 block relative line-clamp-2">
                {suggestion.detailedSuggestion}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

MessageSuggestions.displayName = "MessageSuggestions";
