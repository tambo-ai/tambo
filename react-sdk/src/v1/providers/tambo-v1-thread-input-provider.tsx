"use client";

/**
 * TamboV1ThreadInputProvider - Shared Thread Input Context for v1 API
 *
 * Provides shared input state across all components, enabling features like
 * suggestions to update the input field directly.
 *
 * This mirrors the beta SDK's TamboThreadInputProvider pattern.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  useMessageImages,
  type StagedImage,
} from "../../hooks/use-message-images";
import {
  useTamboMutation,
  type UseTamboMutationResult,
} from "../../hooks/react-query-hooks";
import { useTamboV1SendMessage } from "../hooks/use-tambo-v1-send-message";
import { useStreamState } from "./tambo-v1-stream-context";

/**
 * Error messages for various input-related error scenarios
 */
export const INPUT_ERROR_MESSAGES = {
  EMPTY: "Message cannot be empty",
  NETWORK: "Network error. Please check your connection",
  SERVER: "Server error. Please try again",
  VALIDATION: "Invalid message format",
} as const;

/**
 * Options for submitting a message
 */
export interface SubmitOptions {
  /**
   * Enable debug logging for the stream
   */
  debug?: boolean;
}

/**
 * Context props for thread input state
 */
export interface TamboV1ThreadInputContextProps extends Omit<
  UseTamboMutationResult<
    { threadId: string | undefined },
    Error,
    SubmitOptions | undefined
  >,
  "mutate" | "mutateAsync"
> {
  /** Current value of the input field */
  value: string;

  /**
   * Function to update the input value
   * @param value - New value for the input field
   */
  setValue: React.Dispatch<React.SetStateAction<string>>;

  /**
   * Function to submit the current input value
   * @param options - Submission options
   * @returns Promise with the threadId
   */
  submit: (
    options?: SubmitOptions,
  ) => Promise<{ threadId: string | undefined }>;

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

  /** Current thread ID being used for input */
  threadId: string | undefined;

  /**
   * Set the thread ID for input submission.
   * If not set, a new thread will be created on submit.
   */
  setThreadId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const TamboV1ThreadInputContext = createContext<
  TamboV1ThreadInputContextProps | undefined
>(undefined);

/**
 * Provider that manages shared thread input state across all components.
 *
 * This ensures that useTamboV1ThreadInput, useTamboV1Suggestions, and other components
 * all share the same input state.
 * @param props - Provider props
 * @param props.children - Child components
 * @returns Thread input context provider
 */
export function TamboV1ThreadInputProvider({ children }: PropsWithChildren) {
  const [inputValue, setInputValue] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const imageState = useMessageImages();
  const streamState = useStreamState();

  // Use the current thread from stream state if no explicit threadId is set
  const effectiveThreadId =
    threadId ?? streamState.currentThreadId ?? undefined;
  const sendMessage = useTamboV1SendMessage(effectiveThreadId);

  const submitFn = useCallback(
    async (
      options?: SubmitOptions,
    ): Promise<{ threadId: string | undefined }> => {
      const trimmedValue = inputValue.trim();

      // Check if we have content to send
      if (!trimmedValue && imageState.images.length === 0) {
        throw new Error(INPUT_ERROR_MESSAGES.EMPTY);
      }

      // Build message content
      // For now, just handle text. Image support can be added later.
      const result = await sendMessage.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: trimmedValue || "Image message" }],
        },
        debug: options?.debug,
      });

      // Clear input and images after successful submission
      setInputValue("");
      imageState.clearImages();

      // Update threadId if a new thread was created
      if (result.threadId && !threadId) {
        setThreadId(result.threadId);
      }

      return result;
    },
    [inputValue, imageState, sendMessage, threadId],
  );

  const {
    mutateAsync: submitAsync,
    mutate: _unusedSubmit,
    ...mutationState
  } = useTamboMutation({
    mutationFn: submitFn,
  });

  const contextValue: TamboV1ThreadInputContextProps = {
    ...mutationState,
    value: inputValue,
    setValue: setInputValue,
    submit: submitAsync,
    images: imageState.images,
    addImage: imageState.addImage,
    addImages: imageState.addImages,
    removeImage: imageState.removeImage,
    clearImages: imageState.clearImages,
    threadId: effectiveThreadId,
    setThreadId,
  };

  return (
    <TamboV1ThreadInputContext.Provider value={contextValue}>
      {children}
    </TamboV1ThreadInputContext.Provider>
  );
}

/**
 * Hook to access the shared thread input state.
 *
 * All components using this hook share the same input state, enabling
 * features like suggestions to update the input field directly.
 * @returns The shared thread input context
 * @throws {Error} If used outside TamboV1ThreadInputProvider
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { value, setValue, submit, isPending } = useTamboV1ThreadInput();
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
 *       <input
 *         value={value}
 *         onChange={(e) => setValue(e.target.value)}
 *         disabled={isPending}
 *       />
 *       <button type="submit" disabled={isPending}>Send</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useTamboV1ThreadInput(): TamboV1ThreadInputContextProps {
  const context = useContext(TamboV1ThreadInputContext);
  if (!context) {
    throw new Error(
      "useTamboV1ThreadInput must be used within TamboV1Provider",
    );
  }
  return context;
}
