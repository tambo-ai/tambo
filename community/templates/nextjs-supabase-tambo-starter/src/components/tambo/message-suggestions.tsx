"use client";

import { MessageGenerationStage } from "./message-generation-stage";
import { Tooltip, TooltipProvider } from "./suggestions-tooltip";
import { cn } from "@/lib/utils";
import type { Suggestion, TamboThread } from "@tambo-ai/react";
import {
  GenerationStage,
  useTambo,
  useTamboSuggestions,
} from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";

/* -------------------------------------------------------
   Cyberpunk shared styles
------------------------------------------------------- */

const opsContainer = `
  border border-border
  bg-card
`;

const opsSuggestion = `
  px-3 py-1.5
  text-xs tracking-widest uppercase
  border border-border
  bg-secondary
  text-foreground
  transition-colors
  hover:bg-muted
`;

const opsSelected = `
  border-primary
  bg-primary
  text-primary-foreground
`;

const opsDisabled = `
  opacity-40 cursor-not-allowed
`;

const opsLoadingText = `
  text-xs tracking-widest uppercase text-muted-foreground
`;

/* -------------------------------------------------------
   Context
------------------------------------------------------- */

interface MessageSuggestionsContextValue {
  suggestions: Suggestion[];
  selectedSuggestionId: string | null;
  accept: (options: { suggestion: Suggestion }) => Promise<void>;
  isGenerating: boolean;
  error: Error | null;
  thread: TamboThread;
  isMac: boolean;
}

const MessageSuggestionsContext =
  React.createContext<MessageSuggestionsContextValue | null>(null);

const useMessageSuggestionsContext = () => {
  const ctx = React.useContext(MessageSuggestionsContext);
  if (!ctx) {
    throw new Error(
      "MessageSuggestions sub-components must be used within MessageSuggestions",
    );
  }
  return ctx;
};

/* -------------------------------------------------------
   Root Component
------------------------------------------------------- */

export interface MessageSuggestionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
  children?: React.ReactNode;
  initialSuggestions?: Suggestion[];
}

const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(
  (
    {
      children,
      className,
      maxSuggestions = 3,
      initialSuggestions = [],
      ...props
    },
    ref,
  ) => {
    const { thread } = useTambo();
    const {
      suggestions: generatedSuggestions,
      selectedSuggestionId,
      accept,
      generateResult: { isPending: isGenerating, error },
    } = useTamboSuggestions({ maxSuggestions });

    const suggestions = React.useMemo(() => {
      if (!thread?.messages?.length && initialSuggestions.length > 0) {
        return initialSuggestions.slice(0, maxSuggestions);
      }
      return generatedSuggestions;
    }, [
      thread?.messages?.length,
      generatedSuggestions,
      initialSuggestions,
      maxSuggestions,
    ]);

    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");

    const contextValue = React.useMemo(
      () => ({
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      }),
      [
        suggestions,
        selectedSuggestionId,
        accept,
        isGenerating,
        error,
        thread,
        isMac,
      ],
    );

    /* Keyboard shortcuts preserved */
    React.useEffect(() => {
      if (!suggestions.length) return;

      const handler = (e: KeyboardEvent) => {
        const modifier = isMac
          ? e.metaKey && e.altKey
          : e.ctrlKey && e.altKey;

        if (!modifier) return;

        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < suggestions.length) {
          e.preventDefault();
          void accept({ suggestion: suggestions[idx] });
        }
      };

      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [suggestions, accept, isMac]);

    if (!thread?.messages?.length && initialSuggestions.length === 0) {
      return null;
    }

    return (
      <MessageSuggestionsContext.Provider value={contextValue}>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn(
              "mt-2 p-4 pb-3",
              className,
            )}
            {...props}
          >
            {/* Header row */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                Suggested actions
              </span>

              {isGenerating && (
                <span className={opsLoadingText}>
                  Generating…
                </span>
              )}
            </div>
            {children}
          </div>
        </TooltipProvider>
      </MessageSuggestionsContext.Provider>
    );
  },
);

MessageSuggestions.displayName = "MessageSuggestions";


/* -------------------------------------------------------
   Status
------------------------------------------------------- */

const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className }, ref) => {
  const { error, isGenerating, thread } =
    useMessageSuggestionsContext();

  if (
    !error &&
    !isGenerating &&
    thread?.generationStage === GenerationStage.COMPLETE
  ) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 flex items-center gap-3",
        "text-[10px] tracking-widest uppercase",
        "text-muted-foreground",
        className,
      )}
    >
      {error && (
        <span className="text-destructive">
          Error: {error.message}
        </span>
      )}

      {thread?.generationStage &&
        thread.generationStage !== GenerationStage.COMPLETE && (
          <MessageGenerationStage showLabel />
        )}

      {isGenerating && (
        <span className="flex items-center gap-2">
          <Loader2Icon className="h-3 w-3 animate-spin" />
          Processing suggestions
        </span>
      )}
    </div>
  );
});
MessageSuggestionsStatus.displayName =
  "MessageSuggestions.Status";

/* -------------------------------------------------------
   Suggestions List
------------------------------------------------------- */

const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className }, ref) => {
  const {
    suggestions,
    selectedSuggestionId,
    accept,
    isGenerating,
    isMac,
  } = useMessageSuggestionsContext();

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-2 overflow-x-auto py-2",
        className,
      )}
    >
      {suggestions.length > 0 ? (
        suggestions.map((s, i) => (
          <Tooltip
            key={s.id}
            content={`${modKey}+${altKey}+${i + 1}`}
          >
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => accept({ suggestion: s })}
              className={cn(
                opsSuggestion,
                selectedSuggestionId === s.id && opsSelected,
                isGenerating && opsDisabled,
              )}
            >
              {s.title}
            </button>
          </Tooltip>
        ))
      ) : (
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          No suggestions available
        </span>
      )}
    </div>
  );
});
MessageSuggestionsList.displayName =
  "MessageSuggestions.List";

/* -------------------------------------------------------
   Exports
------------------------------------------------------- */

export {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
};
