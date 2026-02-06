"use client";

import * as React from "react";

/**
 * Represents a single message content item from an MCP prompt.
 */
export interface PromptMessageContent {
  type?: string;
  text?: string;
}

/**
 * Represents a single message from an MCP prompt.
 */
export interface PromptMessage {
  content?: PromptMessageContent;
}

/**
 * Represents an entry in the prompt list from MCP servers.
 */
export interface McpPromptEntry {
  server: { url: string };
  prompt: { name: string; description?: string };
}

/**
 * Context value for the MCP prompt button compound component.
 */
export interface McpPromptButtonContextValue {
  /** List of available prompts from MCP servers */
  promptList: McpPromptEntry[] | undefined;
  /** Whether the prompt list is loading */
  isLoading: boolean;
  /** Currently selected prompt name */
  selectedPromptName: string | null;
  /** Error message for display */
  promptError: string | null;
  /** Handler to select a prompt by name */
  onSelectPrompt: (name: string) => void;
}

const McpPromptButtonContext =
  React.createContext<McpPromptButtonContextValue | null>(null);

/**
 * Hook to access the MCP prompt button context.
 * @throws Error if used outside of McpPromptButton.Root
 * @returns The MCP prompt button context value
 */
export function useMcpPromptButtonContext(): McpPromptButtonContextValue {
  const context = React.useContext(McpPromptButtonContext);
  if (!context) {
    throw new Error(
      "useMcpPromptButtonContext must be used within McpPromptButton.Root",
    );
  }
  return context;
}

/**
 * Hook to optionally access the MCP prompt button context.
 * Returns null if used outside of McpPromptButton.Root.
 * @returns The MCP prompt button context value or null
 */
export function useOptionalMcpPromptButtonContext(): McpPromptButtonContextValue | null {
  return React.useContext(McpPromptButtonContext);
}

export { McpPromptButtonContext };
