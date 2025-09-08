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
import { useMessageImages, StagedImage } from "../hooks/use-message-images";
import { ThreadInputError } from "../model/thread-input-error";
import { validateInput } from "../model/validate-input";
import { buildMessageContent } from "../util/message-builder";
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

export interface TamboThreadInputContextProps
  extends Omit<
    UseTamboMutationResult<
      void,
      Error,
      | {
          contextKey?: string;
          streamResponse?: boolean;
          forceToolChoice?: string;
          additionalContext?: Record<string, any>;
        }
      | undefined,
      unknown
    >,
    "mutate" | "mutateAsync"
  > {
  /** Current value of the input field */
  value: string;
  /**
   * Function to update the input value
   * @param value - New value for the input field
   */
  setValue: (value: string) => void;
  /**
   * Function to submit the current input value
   * @param options - Submission options
   */
  submit: (options?: {
    contextKey?: string;
    streamResponse?: boolean;
    forceToolChoice?: string;
    additionalContext?: Record<string, any>;
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

export interface TamboThreadInputProviderProps {
  contextKey?: string;
}

/**
 * Provider that manages shared thread input state across all components
 * This ensures that useTamboThreadInput, useTamboSuggestions, and components
 * all share the same input state
 * @param props - The props for the TamboThreadInputProvider
 * @param props.contextKey - Optional context key.
 * @param props.children - The children to render.
 * @returns The thread input context
 */
export const TamboThreadInputProvider: React.FC<
  PropsWithChildren<TamboThreadInputProviderProps>
> = ({ children, contextKey }) => {
  const { thread, sendThreadMessage } = useTamboThread();
  const [inputValue, setInputValue] = useState("");
  const imageState = useMessageImages();

  const submit = useCallback(
    async ({
      contextKey: submitContextKey,
      streamResponse,
      forceToolChoice,
      additionalContext,
    }: {
      contextKey?: string;
      streamResponse?: boolean;
      forceToolChoice?: string;
      additionalContext?: Record<string, any>;
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

      // Build message content with text and images
      const messageContent = buildMessageContent(inputValue, imageState.images);

      try {
        await sendThreadMessage(inputValue || "Image message", {
          threadId: thread.id,
          contextKey: submitContextKey ?? contextKey ?? undefined,
          streamResponse: streamResponse,
          forceToolChoice: forceToolChoice,
          additionalContext: additionalContext,
          content: messageContent,
        });
      } catch (error: any) {
        // Handle image-related errors with friendly messages
        if (imageState.images.length > 0) {
          const errorMessage = error?.message?.toLowerCase() ?? "";

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

      // Clear both text and images after successful submission
      setInputValue("");
      imageState.clearImages();
    },
    [inputValue, sendThreadMessage, thread.id, contextKey, imageState],
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
