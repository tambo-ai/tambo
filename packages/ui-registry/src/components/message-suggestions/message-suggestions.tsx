"use client";

import {
  MessageSuggestions as MessageSuggestionsBase,
  type MessageSuggestionsGenerationStageRenderProps,
  type MessageSuggestionsListRenderProps,
  type MessageSuggestionsRootProps,
  type MessageSuggestionsStatusProps as MessageSuggestionsBaseStatusProps,
  type MessageSuggestionsStatusRenderProps,
} from "@tambo-ai/react-ui-base/message-suggestions";
import { cn } from "@tambo-ai/ui-registry/utils";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { Tooltip, TooltipProvider } from "./suggestions-tooltip";

/**
 * Props for the MessageSuggestions component.
 * Extends the base root props.
 */
export type MessageSuggestionsProps = MessageSuggestionsRootProps;

/**
 * The root container for message suggestions.
 * Provides context for its children and handles overall state management.
 * @component MessageSuggestions
 * @example
 * ```tsx
 * <MessageSuggestions maxSuggestions={3}>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 * @returns The styled message suggestions container, or null if there is nothing to display.
 */
const MessageSuggestions = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsProps
>(({ children, className, ...props }, ref) => {
  return (
    <MessageSuggestionsBase.Root
      ref={ref}
      className={cn("px-4 pb-2", className)}
      {...props}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </MessageSuggestionsBase.Root>
  );
});
MessageSuggestions.displayName = "MessageSuggestions";

/**
 * Props for the MessageSuggestionsStatus component.
 */
export type MessageSuggestionsStatusProps = MessageSuggestionsBaseStatusProps;

/**
 * Displays loading, error, or generation stage information.
 * Automatically connects to the context to show the appropriate status.
 * @component MessageSuggestions.Status
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 * @returns The styled status display element.
 */
const MessageSuggestionsStatus = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsStatusProps
>(({ className, ...props }, ref) => {
  return (
    <MessageSuggestionsBase.Status
      ref={ref}
      className={cn(
        "p-2 rounded-md text-sm bg-transparent",
        "data-[idle]:p-0 data-[idle]:min-h-0 data-[idle]:mb-0",
        className,
      )}
      {...props}
    >
      {({
        error,
        isGenerating,
        generationStage,
      }: MessageSuggestionsStatusRenderProps) => (
        <>
          <StatusErrorContent error={error} />
          <div className="generation-stage-container">
            <StatusGenerationContent
              isGenerating={isGenerating}
              generationStage={generationStage}
            />
          </div>
        </>
      )}
    </MessageSuggestionsBase.Status>
  );
});
MessageSuggestionsStatus.displayName = "MessageSuggestions.Status";

/**
 * Internal component to render error content within the status area.
 * @returns Error message display or null.
 */
function StatusErrorContent({ error }: { error: Error | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
      <p>{error.message}</p>
    </div>
  );
}

/**
 * Internal component to render generation stage or loading content.
 * @returns Generation stage display, loading spinner, or null.
 */
function StatusGenerationContent({
  isGenerating,
  generationStage,
}: {
  isGenerating: boolean;
  generationStage: string | undefined;
}) {
  if (generationStage && generationStage !== "COMPLETE") {
    return (
      <MessageSuggestionsBase.GenerationStage className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md bg-transparent text-muted-foreground">
        {({
          label,
          showLabel,
        }: MessageSuggestionsGenerationStageRenderProps) => (
          <>
            <Loader2Icon className="h-3 w-3 animate-spin" />
            {showLabel && <span>{label}</span>}
          </>
        )}
      </MessageSuggestionsBase.GenerationStage>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        <p>Generating suggestions...</p>
      </div>
    );
  }

  return null;
}

/**
 * Props for the MessageSuggestionsList component.
 */
export type MessageSuggestionsListProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Internal function to get className for suggestion button based on state.
 * @returns The appropriate Tailwind class string.
 */
function getSuggestionButtonClassName({
  isGenerating,
  isSelected,
}: {
  isGenerating: boolean;
  isSelected: boolean;
}) {
  if (isGenerating) {
    return "bg-muted/50 text-muted-foreground";
  }
  if (isSelected) {
    return "bg-accent text-accent-foreground";
  }
  return "bg-background hover:bg-accent hover:text-accent-foreground";
}

/**
 * Displays the list of suggestion buttons.
 * Automatically connects to the context to show the suggestions.
 * @component MessageSuggestions.List
 * @example
 * ```tsx
 * <MessageSuggestions>
 *   <MessageSuggestions.Status />
 *   <MessageSuggestions.List />
 * </MessageSuggestions>
 * ```
 * @returns The styled suggestion list element.
 */
const MessageSuggestionsList = React.forwardRef<
  HTMLDivElement,
  MessageSuggestionsListProps
>(({ className, ...props }, ref) => {
  return (
    <MessageSuggestionsBase.List
      ref={ref}
      className={cn(
        "flex space-x-2 overflow-x-auto pb-2 rounded-md bg-transparent min-h-[2.5rem]",
        "data-[generating]:opacity-70",
        className,
      )}
      {...props}
    >
      {({
        suggestions,
        isGenerating,
        selectedSuggestionId,
        modKey,
        altKey,
      }: MessageSuggestionsListRenderProps) => (
        <>
          {suggestions.length > 0
            ? suggestions.map((suggestion, index) => (
                <Tooltip
                  key={suggestion.id}
                  content={
                    <span suppressHydrationWarning>
                      {modKey}+{altKey}+{index + 1}
                    </span>
                  }
                  side="top"
                >
                  <MessageSuggestionsBase.Item
                    suggestion={suggestion}
                    index={index}
                    className={cn(
                      "py-2 px-2.5 rounded-2xl text-xs transition-colors",
                      "border border-flat",
                      getSuggestionButtonClassName({
                        isGenerating,
                        isSelected: selectedSuggestionId === suggestion.id,
                      }),
                    )}
                  >
                    <span className="font-medium">{suggestion.title}</span>
                  </MessageSuggestionsBase.Item>
                </Tooltip>
              ))
            : Array.from({ length: 3 }, (_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="py-2 px-2.5 rounded-2xl text-xs border border-flat bg-muted/20 text-transparent animate-pulse"
                  data-placeholder-index={index}
                >
                  <span className="invisible">Placeholder</span>
                </div>
              ))}
        </>
      )}
    </MessageSuggestionsBase.List>
  );
});
MessageSuggestionsList.displayName = "MessageSuggestions.List";

export {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
  Tooltip,
  TooltipProvider,
};
