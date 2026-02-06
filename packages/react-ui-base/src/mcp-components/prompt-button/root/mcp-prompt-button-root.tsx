"use client";

import { Slot } from "@radix-ui/react-slot";
import { useTamboMcpPrompt, useTamboMcpPromptList } from "@tambo-ai/react/mcp";
import * as React from "react";
import { BaseProps } from "../../../types/component-render-or-children";
import { extractPromptText, isValidPromptData } from "../utils";
import { McpPromptButtonContext } from "./mcp-prompt-button-context";

export type McpPromptButtonRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Callback to insert text into the input */
    onInsertText: (text: string) => void;
    /** Current input value */
    value: string;
  }
>;

/**
 * Root primitive for the MCP prompt button compound component.
 * Provides context for child components including prompt list data,
 * selection state, and error handling.
 * Renders nothing if no prompts are available.
 * @returns The root container element with MCP prompt button context, or null if no prompts
 */
export const McpPromptButtonRoot = React.forwardRef<
  HTMLDivElement,
  McpPromptButtonRootProps
>(function McpPromptButtonRoot(
  { children, asChild, onInsertText, value, ...props },
  ref,
) {
  const { data: promptList, isLoading } = useTamboMcpPromptList();
  const [selectedPromptName, setSelectedPromptName] = React.useState<
    string | null
  >(null);
  const [promptError, setPromptError] = React.useState<string | null>(null);
  const { data: promptData, error: fetchError } = useTamboMcpPrompt(
    selectedPromptName ?? "",
  );

  // When prompt data is fetched, validate and insert it into the input
  React.useEffect(() => {
    if (selectedPromptName && promptData) {
      // Validate prompt data structure
      if (!isValidPromptData(promptData)) {
        setPromptError("Invalid prompt format received");
        setSelectedPromptName(null);
        return;
      }

      // Extract text with safe access
      const promptText = extractPromptText(promptData.messages);

      if (!promptText) {
        setPromptError("Prompt contains no text content");
        setSelectedPromptName(null);
        return;
      }

      // Clear any previous errors
      setPromptError(null);

      // Insert the prompt text, appending to existing value if any
      const newValue = value ? `${value}\n\n${promptText}` : promptText;
      onInsertText(newValue);

      // Reset the selected prompt
      setSelectedPromptName(null);
    }
  }, [promptData, selectedPromptName, onInsertText, value]);

  // Handle fetch errors
  React.useEffect(() => {
    if (fetchError) {
      setPromptError("Failed to load prompt");
      setSelectedPromptName(null);
    }
  }, [fetchError]);

  // Clear error after a delay
  React.useEffect(() => {
    if (promptError) {
      const timer = setTimeout(() => setPromptError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [promptError]);

  const contextValue = React.useMemo(
    () => ({
      promptList,
      isLoading,
      selectedPromptName,
      promptError,
      onSelectPrompt: setSelectedPromptName,
    }),
    [promptList, isLoading, selectedPromptName, promptError],
  );

  // Only show if prompts are available (hide during loading and when no prompts)
  if (!promptList || promptList.length === 0) {
    return null;
  }

  const Comp = asChild ? Slot : "div";

  return (
    <McpPromptButtonContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="mcp-prompt-button" {...props}>
        {children}
      </Comp>
    </McpPromptButtonContext.Provider>
  );
});
McpPromptButtonRoot.displayName = "McpPromptButton.Root";
