"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { MessageGenerationStage } from "@/components/ui/message-generation-stage";

/**
 * Represents the suggestions for a message
 * @property {string} className - Optional className for custom styling
 * @property {number} maxSuggestions - Maximum number of suggestions to show
 */

export interface MessageSuggestionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
}

export function MessageSuggestions({
  className,
  maxSuggestions = 3,
  ...props
}: MessageSuggestionsProps) {
  const { thread } = useTambo();
  const {
    suggestions,
    selectedSuggestionId,
    accept,
    generateResult: { isPending: isGenerating, error },
  } = useTamboSuggestions({
    maxSuggestions,
  });
  const [isMac, setIsMac] = useState(false);

  // Track the last AI message ID to detect new messages
  const lastAiMessageIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the last AI message
  const lastAiMessage = thread?.messages
    ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
    : null;

  // When a new AI message appears, update the reference
  useEffect(() => {
    if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
      lastAiMessageIdRef.current = lastAiMessage.id;

      // Set a timeout to log if suggestions don't appear within a reasonable time
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {}, 5000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [lastAiMessage, suggestions.length]);

  useEffect(() => {
    const isMacOS =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    setIsMac(isMacOS);
  }, []);

  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = isMac
        ? event.metaKey && event.altKey
        : event.ctrlKey && event.altKey;

      if (modifierPressed) {
        const keyNum = parseInt(event.key);
        if (!isNaN(keyNum) && keyNum > 0 && keyNum <= suggestions.length) {
          event.preventDefault();
          const suggestionIndex = keyNum - 1;
          accept({ suggestion: suggestions[suggestionIndex] });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, accept, isMac]);

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  // If we have no messages yet, only show the button
  if (!thread?.messages?.length) {
    return null;
  }

  // Basic container layout
  return (
    <TooltipProvider>
      <div
        className={cn("px-4 py-2 border-t border-gray-200", className)}
        {...props}
      >
        {/* Error state */}
        {error && (
          <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
            <p>{error.message}</p>
          </div>
        )}

        {/* First show generation stage until complete, then show suggestions UI */}
        {thread?.generationStage && thread.generationStage !== "COMPLETE" ? (
          <div className="p-2 rounded-md text-sm bg-muted/30">
            <MessageGenerationStage />
          </div>
        ) : (
          <>
            <div className="p-2 rounded-md text-sm bg-muted/30">
              {/* Show loading indicator when generating */}
              {isGenerating && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <p>Generating suggestions...</p>
                </div>
              )}

              {/* Show suggestions when available */}
              {suggestions.length > 0 && (
                <div
                  className={cn(
                    "flex space-x-2 overflow-x-auto",
                    isGenerating ? "opacity-70" : "",
                  )}
                >
                  {suggestions.map((suggestion, index) => (
                    <Tooltip
                      key={suggestion.id}
                      content={`${modKey}+${altKey}+${index + 1}`}
                      side="top"
                    >
                      <button
                        className={cn(
                          "py-1 px-2.5 rounded-full text-xs transition-colors",
                          "border border-input",
                          isGenerating
                            ? "bg-muted/50 text-muted-foreground"
                            : selectedSuggestionId === suggestion.id
                              ? "bg-accent text-accent-foreground"
                              : "bg-background hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={async () =>
                          !isGenerating && (await accept({ suggestion }))
                        }
                        disabled={isGenerating}
                      >
                        <span className="font-medium">{suggestion.title}</span>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
