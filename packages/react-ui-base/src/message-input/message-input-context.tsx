"use client";

import type { StagedImage } from "@tambo-ai/react";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";

/**
 * Maximum number of images that can be staged at once.
 */
export const MAX_IMAGES = 10;

/**
 * Symbol for marking pasted images.
 * Uses a unique well-known symbol to detect if an image was pasted vs uploaded.
 */
export const IS_PASTED_IMAGE: unique symbol = Symbol.for(
  "tambo-is-pasted-image",
) as typeof IS_PASTED_IMAGE;

/**
 * Extend the File interface to include IS_PASTED_IMAGE symbol.
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

/**
 * Provider interface for searching resources (for "@" mentions).
 * Empty query string "" should return all available resources.
 */
export interface ResourceProvider {
  /** Search for resources matching the query */
  search(query: string): Promise<ResourceItem[]>;
}

/**
 * Provider interface for searching and fetching prompts (for "/" commands).
 * Empty query string "" should return all available prompts.
 */
export interface PromptProvider {
  /** Search for prompts matching the query */
  search(query: string): Promise<PromptItem[]>;
  /** Get the full prompt details including text by ID */
  get(id: string): Promise<PromptItem>;
}

/**
 * Base interface for suggestion items (resources and prompts).
 */
interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

/**
 * Represents a resource item that appears in the "@" mention dropdown.
 * Resources are referenced by ID/URI and appear as visual mention nodes in the editor.
 */
export interface ResourceItem extends SuggestionItem {
  componentData?: unknown;
}

/**
 * Represents a prompt item that appears in the "/" command dropdown.
 * Prompts contain text that gets inserted into the editor.
 */
export interface PromptItem extends SuggestionItem {
  /** The actual prompt text to insert into the editor */
  text: string;
}

/**
 * Minimal editor interface exposed to parent components.
 * Hides TipTap implementation details and exposes only necessary operations.
 */
export interface TamboEditor {
  /** Focus the editor at a specific position */
  focus(position?: "start" | "end"): void;
  /** Set the editor content */
  setContent(content: string): void;
  /** Append text to the end of the editor content */
  appendText(text: string): void;
  /** Get the text and resource names */
  getTextWithResourceURIs(): {
    text: string;
    resourceNames: Record<string, string>;
  };
  /** Check if a mention with the given id exists */
  hasMention(id: string): boolean;
  /** Insert a mention node with a following space */
  insertMention(id: string, label: string): void;
  /** Set whether the editor is editable */
  setEditable(editable: boolean): void;
}

// Re-export StagedImage from @tambo-ai/react
export type { StagedImage };

/**
 * Context value for the MessageInput compound component.
 */
export interface MessageInputContextValue {
  /** Current input value */
  value: string;
  /** Update the input value */
  setValue: (value: string) => void;
  /** Submit the message with options */
  submit: (options: {
    streamResponse?: boolean;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  /** Handle form submission event */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** Whether a submission is in progress */
  isPending: boolean;
  /** Any error from the submission */
  error: Error | null;
  /** Reference to the TamboEditor instance */
  editorRef: React.RefObject<TamboEditor | null>;
  /** Error from the submission */
  submitError: string | null;
  /** Set the submission error */
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  /** Error related to image uploads */
  imageError: string | null;
  /** Set the image upload error */
  setImageError: React.Dispatch<React.SetStateAction<string | null>>;
  /** Current elicitation request (read-only) */
  elicitation: TamboElicitationRequest | null;
  /** Resolve the elicitation promise (automatically clears state) */
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
  /** Whether the thread is idle */
  isIdle: boolean;
  /** Cancel the current operation */
  cancel: () => Promise<void>;
  /** Staged images */
  images: StagedImage[];
  /** Add images to the staged list */
  addImages: (files: File[]) => Promise<void>;
  /** Add a single image to the staged list */
  addImage: (file: File) => Promise<void>;
  /** Remove an image from the staged list */
  removeImage: (id: string) => void;
  /** Whether the token is updating */
  isUpdatingToken: boolean;
  /** Whether dragging files over the input */
  isDragging: boolean;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 */
export const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * @returns The message input context value.
 * @throws Error if used outside of MessageInput.Root
 */
export function useMessageInputContext(): MessageInputContextValue {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput components must be used within MessageInput.Root",
    );
  }
  return context;
}

export { MessageInputContext as Context };
