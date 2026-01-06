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
  StagedAttachment,
  StagedImage,
  useMessageAttachments,
} from "../hooks/use-message-attachments";
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
  setValue: (value: string) => void;
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
  /** Currently staged attachments (images, documents, text files) */
  stagedAttachments: StagedAttachment[];
  /** Add attachments and upload to storage. Returns the staged attachments with storage paths. */
  addAttachments: (files: File[]) => Promise<StagedAttachment[]>;
  /** Remove a staged attachment by id */
  removeAttachment: (id: string) => void;
  /** Clear all staged attachments */
  clearAttachments: () => void;
  /** Whether any attachments are currently uploading */
  isUploading: boolean;
  /** Whether any attachments have errors */
  hasErrors: boolean;

  // Backwards compatibility (deprecated)
  /**
   * @deprecated Use stagedAttachments instead
   */
  images: StagedImage[];
  /**
   * @deprecated Use addAttachments instead
   */
  addImage: (file: File) => Promise<void>;
  /**
   * @deprecated Use addAttachments instead
   */
  addImages: (files: File[]) => Promise<StagedAttachment[]>;
  /**
   * @deprecated Use removeAttachment instead
   */
  removeImage: (id: string) => void;
  /**
   * @deprecated Use clearAttachments instead
   */
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
  const attachmentState = useMessageAttachments();
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
      const uploadedAttachments = attachmentState.stagedAttachments.filter(
        (a) => a.status === "uploaded",
      );
      if (!inputValue.trim() && uploadedAttachments.length === 0) {
        throw new ThreadInputError(INPUT_ERROR_MESSAGES.EMPTY, {
          cause: "No text or files to send",
        });
      }

      // Ensure all files are uploaded before submitting
      if (attachmentState.isUploading) {
        throw new ThreadInputError(
          "Please wait for files to finish uploading before sending.",
          { cause: "Files still uploading" },
        );
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

      // Build message content with text, attachments, resource names, and resolved content
      const messageContent = buildMessageContent(
        inputValue,
        attachmentState.stagedAttachments,
        resourceNames,
        resolvedContent,
      );

      try {
        await sendThreadMessage(inputValue || "File message", {
          threadId: thread.id,
          contextKey,
          streamResponse: streamResponse,
          forceToolChoice: forceToolChoice,
          additionalContext: additionalContext,
          content: messageContent,
        });
        clearInteractableSelections();
      } catch (error: any) {
        // Handle attachment-related errors with friendly messages
        const hasImages = attachmentState.stagedAttachments.some((a) =>
          a.mimeType.startsWith("image/"),
        );
        if (attachmentState.stagedAttachments.length > 0) {
          const errorMessage = error?.message?.toLowerCase() ?? "";

          // Backend not yet supporting file/resource content type
          if (
            errorMessage.includes("unknown content part type: image") ||
            errorMessage.includes("unknown content part type: resource")
          ) {
            throw new ThreadInputError(
              "File attachments are not yet supported by the backend. This feature is coming soon.",
              { cause: error },
            );
          }

          // Handle specific model vision support errors (for images)
          if (hasImages) {
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

          // Handle PDF/document errors
          if (
            errorMessage.includes("pdf") ||
            errorMessage.includes("document")
          ) {
            throw new ThreadInputError(
              "This model doesn't support document attachments. Please use a model with document processing capabilities.",
              { cause: error },
            );
          }
        }

        throw error;
      }

      // Clear text and attachments after successful submission
      setInputValue("");
      attachmentState.clearAttachments();
    },
    [
      inputValue,
      sendThreadMessage,
      thread.id,
      contextKey,
      attachmentState,
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

  // Create backwards-compatible wrappers for image functions
  const addImage = useCallback(
    async (file: File) => {
      await attachmentState.addAttachments([file]);
    },
    [attachmentState],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      return await attachmentState.addAttachments(files);
    },
    [attachmentState],
  );

  const value = {
    ...mutationState,
    value: inputValue,
    setValue: setInputValue,
    submit: submitAsync,
    // Attachment API
    stagedAttachments: attachmentState.stagedAttachments,
    addAttachments: attachmentState.addAttachments,
    removeAttachment: attachmentState.removeAttachment,
    clearAttachments: attachmentState.clearAttachments,
    isUploading: attachmentState.isUploading,
    hasErrors: attachmentState.hasErrors,
    // Backwards compatibility (deprecated)
    images: attachmentState.stagedAttachments,
    addImage,
    addImages,
    removeImage: attachmentState.removeAttachment,
    clearImages: attachmentState.clearAttachments,
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
