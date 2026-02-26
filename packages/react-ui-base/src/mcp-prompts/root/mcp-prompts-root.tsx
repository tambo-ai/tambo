"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTamboMcpPrompt, useTamboMcpPromptList } from "@tambo-ai/react/mcp";
import * as React from "react";
import {
  McpPromptsContext,
  type McpPromptsStatus,
} from "./mcp-prompts-context";

/**
 * Represents a single message content item from an MCP prompt.
 */
interface PromptMessageContent {
  type?: string;
  text?: string;
}

/**
 * Represents a single message from an MCP prompt.
 */
interface PromptMessage {
  content?: PromptMessageContent;
}

/**
 * Validates that prompt data has a valid messages array structure.
 * @returns true if the prompt data has valid messages
 */
function isValidPromptData(
  promptData: unknown,
): promptData is { messages: PromptMessage[] } {
  if (!promptData || typeof promptData !== "object") {
    return false;
  }

  const data = promptData as { messages?: unknown };
  return Array.isArray(data.messages);
}

/**
 * Safely extracts text content from prompt messages.
 * @returns Extracted text content joined by newlines
 */
function extractPromptText(messages: PromptMessage[]): string {
  return messages
    .map((msg) => {
      if (
        msg?.content?.type === "text" &&
        typeof msg.content.text === "string"
      ) {
        return msg.content.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export interface McpPromptsRootState extends Record<string, unknown> {
  slot: string;
  promptCount: number;
  isLoading: boolean;
  status: McpPromptsStatus;
}

type McpPromptsRootComponentProps = useRender.ComponentProps<
  "div",
  McpPromptsRootState
>;

export interface McpPromptsRootProps extends McpPromptsRootComponentProps {
  /** Callback invoked when prompt text has been extracted and is ready for insertion. */
  onInsertText?: (text: string) => void;
}

/**
 * Root component for MCP prompt picker.
 * Provides prompt list, selection lifecycle, and error handling to children.
 */
export const McpPromptsRoot = React.forwardRef<
  HTMLDivElement,
  McpPromptsRootProps
>(({ onInsertText, ...props }, ref) => {
  const { data: prompts, isLoading } = useTamboMcpPromptList();
  const [selectedPromptName, setSelectedPromptName] = React.useState<
    string | null
  >(null);
  const [status, setStatus] = React.useState<McpPromptsStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [insertedText, setInsertedText] = React.useState<string | null>(null);

  const { data: promptData, error: fetchError } = useTamboMcpPrompt(
    selectedPromptName ?? undefined,
  );

  // Handle prompt data when fetched
  React.useEffect(() => {
    if (!selectedPromptName || !promptData) return;

    if (!isValidPromptData(promptData)) {
      setError("Invalid prompt format received");
      setStatus("error");
      setSelectedPromptName(null);
      return;
    }

    const text = extractPromptText(promptData.messages);

    if (!text) {
      setError("Prompt contains no text content");
      setStatus("error");
      setSelectedPromptName(null);
      return;
    }

    setError(null);
    setInsertedText(text);
    setStatus("done");
    onInsertText?.(text);
    setSelectedPromptName(null);
  }, [promptData, selectedPromptName, onInsertText]);

  // Handle fetch errors
  React.useEffect(() => {
    if (fetchError) {
      setError("Failed to load prompt");
      setStatus("error");
      setSelectedPromptName(null);
    }
  }, [fetchError]);

  // Auto-clear error after delay
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
        setStatus("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const select = React.useCallback((promptName: string) => {
    setSelectedPromptName(promptName);
    setStatus("fetching");
    setError(null);
    setInsertedText(null);
  }, []);

  const promptList = React.useMemo(() => prompts ?? [], [prompts]);
  const hasPrompts = promptList.length > 0;

  const contextValue = React.useMemo(
    () => ({
      prompts: promptList,
      isLoading,
      selectedPrompt: selectedPromptName,
      status,
      error,
      select,
      insertedText,
    }),
    [
      promptList,
      isLoading,
      selectedPromptName,
      status,
      error,
      select,
      insertedText,
    ],
  );

  const { render, ...componentProps } = props;
  const state: McpPromptsRootState = {
    slot: "mcp-prompts",
    promptCount: promptList.length,
    isLoading,
    status,
  };

  const element = useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
    enabled: hasPrompts,
  });

  if (!hasPrompts && !isLoading) {
    return null;
  }

  return (
    <McpPromptsContext.Provider value={contextValue}>
      {element}
    </McpPromptsContext.Provider>
  );
});
McpPromptsRoot.displayName = "McpPrompts.Root";
