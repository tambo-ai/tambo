"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@tambo-ai/react";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TamboSuggestionsProps {
  maxSuggestions?: number;
}

export const TamboSuggestions = ({
  maxSuggestions = 3,
}: TamboSuggestionsProps) => {
  const {
    suggestions,
    acceptResult: { isPending: isAccepting },
    generateResult: { isPending: isGenerating },
    error,
    accept,
    selectedSuggestionId,
  } = useTamboSuggestions({ maxSuggestions });

  // Get thread to check if there are any messages
  const { thread } = useTambo();
  // Track when we should show the loading animation
  const [showLoading, setShowLoading] = useState(false);

  // Track the last AI message ID to detect new messages
  const lastAiMessageIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the last AI message
  const lastAiMessage = thread?.messages
    ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
    : null;

  // When a new AI message appears, set loading state
  useEffect(() => {
    if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
      console.log("New AI message detected, showing loading state");
      lastAiMessageIdRef.current = lastAiMessage.id;

      // Show loading state
      setShowLoading(true);

      // Set a timeout to hide loading if suggestions don't appear within a reasonable time
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (suggestions.length === 0) {
          console.log(
            "No suggestions received after timeout, hiding loading state",
          );
          setShowLoading(false);
        }
      }, 5000); // 5 second timeout
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [lastAiMessage, suggestions.length]);

  // Update loading state based on generation status
  // TODO: Improve loading state detection using suggestionsQuery.isLoading, suggestionsQuery.isFetching, etc.
  // This will provide more accurate loading indicators when suggestions are being generated

  const handleAccept = useCallback(
    async (suggestion: Suggestion) => {
      try {
        await accept({ suggestion, shouldSubmit: false }); // Set to true for auto-submit
      } catch (error) {
        console.error("Error accepting suggestion:", error);
      }
    },
    [accept],
  );

  if (suggestions.length === 0 && !isGenerating) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isGenerating ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading suggestions...
          </p>
        ) : (
          suggestions.map((suggestion) => {
            const isSelected = selectedSuggestionId === suggestion.id;
            return (
              <Button
                key={suggestion.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={async () => await handleAccept(suggestion)}
                disabled={isAccepting}
                className={cn(
                  isSelected
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700",
                  "transition-all",
                )}
                title={suggestion.detailedSuggestion}
              >
                {suggestion.title}
              </Button>
            );
          })
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
};
