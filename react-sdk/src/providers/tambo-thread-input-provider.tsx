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
import {
  useMessageAttachments,
  StagedAttachment,
} from "../hooks/use-message-images";
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
  /** Currently staged attachments */
  attachments: StagedAttachment[];
  /** Add a single attachment */
  addAttachment: (file: File) => Promise<StagedAttachment>;
  /** Add multiple attachments */
  addAttachments: (files: File[]) => Promise<StagedAttachment[]>;
  /** Remove an attachment by id */
  removeAttachment: (id: string) => void;
  /** Clear all staged attachments */
  clearAttachments: () => void;
  /**
   * @deprecated Use attachments instead.
   */
  images: StagedAttachment[];
  /**
   * @deprecated Use addAttachment instead.
   */
  addImage: (file: File) => Promise<StagedAttachment>;
  /**
   * @deprecated Use addAttachments instead.
   */
  addImages: (files: File[]) => Promise<StagedAttachment[]>;
  /**
   * @deprecated Use removeAttachment instead.
   */
  removeImage: (id: string) => void;
  /**
   * @deprecated Use clearAttachments instead.
   */
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
  const {
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
  } = useMessageAttachments();

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
      if (!inputValue.trim() && attachments.length === 0) {
        throw new ThreadInputError(INPUT_ERROR_MESSAGES.EMPTY, {
          cause: "No text or attachments to send",
        });
      }

      // Build message content with text and attachments
      const messageContent = buildMessageContent(inputValue, attachments);

      try {
        await sendThreadMessage(inputValue || "Attachment message", {
          threadId: thread.id,
          contextKey: submitContextKey ?? contextKey ?? undefined,
          streamResponse: streamResponse,
          forceToolChoice: forceToolChoice,
          additionalContext: additionalContext,
          content: messageContent,
        });
      } catch (error: any) {
        // Handle attachment-related errors with friendly messages
        if (attachments.length > 0) {
          const errorMessage = error?.message?.toLowerCase() ?? "";

          const hasImages = attachments.some(
            (attachment) => attachment.kind === "image",
          );

          // Backend not yet supporting image content type
          if (
            hasImages &&
            errorMessage.includes("unknown content part type: image")
          ) {
            throw new ThreadInputError(
              "Image attachments are not yet supported by the backend. This feature is coming soon.",
              { cause: error },
            );
          }

          // Handle specific model vision support errors
          // OpenAI errors
          if (
            (hasImages &&
              errorMessage.includes(
                "does not support image message content types",
              )) ||
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
            hasImages &&
            (errorMessage.includes("does not support image") ||
              errorMessage.includes("vision not supported"))
          ) {
            throw new ThreadInputError(
              "This Claude model doesn't support images. Please use Claude 3.5 Sonnet, Claude 3 Opus, or other vision-capable models.",
              { cause: error },
            );
          }

          // Generic image/vision errors
          if (
            hasImages &&
            (errorMessage.includes("image") || errorMessage.includes("vision"))
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
    [attachments, contextKey, inputValue, sendThreadMessage, thread.id],
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
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    clearAttachments,
    // Deprecated image-specific aliases
    images: attachments.filter((attachment) => attachment.kind === "image"),
    addImage: async (file: File) => {
      if (!file.type.startsWith("image/")) {
        throw new ThreadInputError(
          "Only image files are allowed. Use addAttachment for other file types.",
        );
      }

      return await addAttachment(file);
    },
    addImages: async (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        throw new ThreadInputError("No valid image files provided");
      }

      return await addAttachments(imageFiles);
    },
    removeImage: removeAttachment,
    clearImages: () => {
      const imageIds = attachments
        .filter((attachment) => attachment.kind === "image")
        .map((attachment) => attachment.id);

      if (imageIds.length === 0) {
        return;
      }

      if (imageIds.length === attachments.length) {
        clearAttachments();
        return;
      }

      imageIds.forEach((id) => removeAttachment(id));
    },
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
