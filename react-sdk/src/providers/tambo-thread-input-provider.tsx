"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  useTamboMutation,
  UseTamboMutationResult,
} from "../hooks/react-query-hooks";
import { StagedImage, useMessageImages } from "../hooks/use-message-images";
import { useTamboMcpServers } from "../mcp/tambo-mcp-provider";
import { ThreadInputError } from "../model/thread-input-error";
import { validateInput } from "../model/validate-input";
import { buildMessageContent } from "../util/message-builder";
import {
  extractResourceUris,
  resolveResourceContents,
} from "../util/resource-content-resolver";
import { useTamboInteractable } from "./tambo-interactable-provider";
import { useTamboRegistry } from "./tambo-registry-provider";
import { useTamboThread } from "./tambo-thread-provider";

/**
 * Error messages for various input-related error scenarios
 * These messages are used to provide user-friendly error feedback
 * @readonly
 */
export const INPUT_ERROR_MESSAGES = {
  EMPTY: "Message cannot be empty",
  NETWORK: "Network error. Please check your connection",
  SERVER: "Server error. Please try again",
  VALIDATION: "Invalid message format",
} as const;

export interface TamboThreadInputContextProps extends Omit<
  UseTamboMutationResult<
    void,
    Error,
    | {
        contextKey?: string;
        streamResponse?: boolean;
        forceToolChoice?: string;
        additionalContext?: Record<string, any>;
      }
    | undefined
  >,
  "mutate" | "mutateAsync"
> {
  /** Current value of the input field */
  value: string;
  /**
   * Function to update the input value
   * @param value - New value for the input field
   */
  setValue: (value: React.SetStateAction<string>) => void;
  /**
   * Function to submit the current input value
   * @param options - Submission options
   */
  submit: (options?: {
    streamResponse?: boolean;
    forceToolChoice?: string;
    additionalContext?: Record<string, any>;
    resourceNames?: Record<string, string>;
  }) => Promise<void>;
  /** Currently staged images */
  images: StagedImage[];
  /** Add a single image */
  addImage: (file: File) => Promise<void>;
  /** Add multiple images */
  addImages: (files: File[]) => Promise<void>;
  /** Remove an image by id */
  removeImage: (id: string) => void;
  /** Clear all staged images */
  clearImages: () => void;
}

export const TamboThreadInputContext = createContext<
  TamboThreadInputContextProps | undefined
>(undefined);

/**
 * Provider that manages shared thread input state across all components
 * This ensures that useTamboThreadInput, useTamboSuggestions, and components
 * all share the same input state
 * @param props - The props for the TamboThreadInputProvider
 * @param props.children - The children to render.
 * @returns The thread input context
 */
export const TamboThreadInputProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { thread, sendThreadMessage, contextKey } = useTamboThread();
  const [inputValue, setInputValue] = useState("");
  const imageState = useMessageImages();
  const mcpServers = useTamboMcpServers();
  const { resourceSource } = useTamboRegistry();
  const { clearInteractableSelections } = useTamboInteractable();
  const submit = useCallback(
    async ({
      streamResponse,
      forceToolChoice,
      additionalContext,
      resourceNames = {},
    }: {
      streamResponse?: boolean;
      forceToolChoice?: string;
      additionalContext?: Record<string, any>;
      resourceNames?: Record<string, string>;
    } = {}) => {
      // Validate text input if present
      if (inputValue?.trim()) {
        const validation = validateInput(inputValue);
        if (!validation.isValid) {
          throw new ThreadInputError(
            `Cannot submit message: ${validation.error ?? INPUT_ERROR_MESSAGES.VALIDATION}`,
            { cause: validation.error },
          );
        }
      }

      // Check if we have content to send
      if (!inputValue.trim() && imageState.images.length === 0) {
        throw new ThreadInputError(INPUT_ERROR_MESSAGES.EMPTY, {
          cause: "No text or images to send",
        });
      }

      // Extract resource URIs from the input text and resolve content for client-side resources
      // (registry and client-side MCP servers). Internal Tambo server resources are skipped
      // since the backend can resolve them.
      const resourceUris = extractResourceUris(inputValue);
      const resolvedContent = await resolveResourceContents(
        resourceUris,
        mcpServers,
        resourceSource ?? undefined,
      );

      // Build message content with text, images, resource names, and resolved content
      const messageContent = buildMessageContent(
        inputValue,
        imageState.images,
        resourceNames,
        resolvedContent,
      );

      try {
        await sendThreadMessage(inputValue || "Image message", {
          threadId: thread.id,
          contextKey,
          streamResponse: streamResponse,
          forceToolChoice: forceToolChoice,
          additionalContext: additionalContext,
          content: messageContent,
        });
        clearInteractableSelections();
      } catch (error: unknown) {
        // Handle image-related errors with friendly messages
        if (imageState.images.length > 0) {
          const errorMessage =
            error instanceof Error ? error.message.toLowerCase() : "";

          // Backend not yet supporting image content type
          if (errorMessage.includes("unknown content part type: image")) {
            throw new ThreadInputError(
              "Image attachments are not yet supported by the backend. This feature is coming soon.",
              { cause: error },
            );
          }

          // Handle specific model vision support errors
          // OpenAI errors
          if (
            errorMessage.includes(
              "does not support image message content types",
            ) ||
            (errorMessage.includes("invalid model") &&
              errorMessage.includes(
                "image_url is only supported by certain models",
              ))
          ) {
            throw new ThreadInputError(
              "This model doesn't support images. Please use GPT-4o, GPT-4 Turbo, or other vision-capable models.",
              { cause: error },
            );
          }

          // Anthropic Claude errors
          if (
            errorMessage.includes("does not support image") ||
            errorMessage.includes("vision not supported")
          ) {
            throw new ThreadInputError(
              "This Claude model doesn't support images. Please use Claude 3.5 Sonnet, Claude 3 Opus, or other vision-capable models.",
              { cause: error },
            );
          }

          // Generic image/vision errors
          if (
            errorMessage.includes("image") ||
            errorMessage.includes("vision")
          ) {
            throw new ThreadInputError(
              "This model doesn't support image attachments. Please use a vision-capable model.",
              { cause: error },
            );
          }
        }

        throw error;
      }

      // Clear text after successful submission
      setInputValue("");
    },
    [
      inputValue,
      sendThreadMessage,
      thread.id,
      contextKey,
      imageState,
      mcpServers,
      resourceSource,
      clearInteractableSelections,
    ],
  );

  const {
    mutateAsync: submitAsync,
    mutate: _unusedSubmit,
    ...mutationState
  } = useTamboMutation({
    mutationFn: submit,
  });

  const value = {
    ...mutationState,
    value: inputValue,
    setValue: setInputValue,
    submit: submitAsync,
    images: imageState.images,
    addImage: imageState.addImage,
    addImages: imageState.addImages,
    removeImage: imageState.removeImage,
    clearImages: imageState.clearImages,
  };

  return (
    <TamboThreadInputContext.Provider value={value}>
      {children}
    </TamboThreadInputContext.Provider>
  );
};

/**
 * Hook to access the shared thread input state
 * contextKey parameter is not passed here anymore. Instead, use the contextKey prop in the TamboProvider.
 * @returns The thread input context
 */
export const useTamboThreadInput = () => {
  const context = useContext(TamboThreadInputContext);
  if (!context) {
    throw new Error(
      "useTamboThreadInput must be used within a TamboThreadInputProvider",
    );
  }

  return context;
};
