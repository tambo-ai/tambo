"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTamboSuggestions } from "@tambo-ai/react";
import { LightbulbIcon, CheckIcon, XIcon } from "lucide-react";

export interface MessageSuggestionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
}

export function MessageSuggestions({
  className,
  maxSuggestions = 3,
  ...props
}: MessageSuggestionsProps) {
  const { suggestions, selectedSuggestionId, accept } = useTamboSuggestions({
    maxSuggestions,
  });
  const [isMac, setIsMac] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const isMacOS =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    setIsMac(isMacOS);
  }, []);

  React.useEffect(() => {
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

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  if (!isVisible) {
    return (
      <div className="px-4 py-2 border-t border-gray-200">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <LightbulbIcon className="h-4 w-4 text-amber-500" />
          <span>Show suggestions</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("px-4 py-2 border-t border-gray-200", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-1">
          <LightbulbIcon className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Suggestions</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted/50 cursor-pointer border border-gray-200"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={cn(
              "p-2 rounded-md text-sm cursor-pointer transition-colors",
              "hover:bg-muted/70",
              selectedSuggestionId === suggestion.id
                ? "bg-muted border-l-2 border-primary"
                : "bg-muted/30",
            )}
            onClick={async () => await accept({ suggestion })}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.title}</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-muted-foreground/30 bg-muted/50">
                  {modKey}+{altKey}+{index + 1}
                </kbd>
              </div>
              <button
                type="button"
                className="h-5 w-5 inline-flex items-center justify-center rounded-md hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  accept({ suggestion, shouldSubmit: true });
                }}
              >
                <CheckIcon className="h-3 w-3" />
              </button>
            </div>
            <p className="text-muted-foreground line-clamp-2">
              {suggestion.detailedSuggestion}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
