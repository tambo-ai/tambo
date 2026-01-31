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
  useEffect,
  useRef,
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
import type { InputMessage } from "../types/message";
import { useStreamDispatch, useStreamState } from "./tambo-v1-stream-context";

// Error messages for various input-related error scenarios.
// TODO: Reintroduce explicit `NETWORK` and `SERVER` keys once `submit()` maps
// failures into a small, stable set of user-facing error codes (at minimum:
// connectivity failures vs non-2xx responses).
export const INPUT_ERROR_MESSAGES = {
  EMPTY: "Message cannot be empty",
  VALIDATION: "Invalid message format",
} as const;

function stagedImageToResourceContent(
  image: StagedImage,
): InputMessage["content"][number] {
  if (!image.dataUrl.startsWith("data:")) {
    throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
  }

  const commaIndex = image.dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
  }

  const header = image.dataUrl.slice("data:".length, commaIndex);
  const [mimeType, ...params] = header.split(";");
  const isBase64 = params.includes("base64");

  if (mimeType !== image.type || !isBase64) {
    throw new Error(INPUT_ERROR_MESSAGES.VALIDATION);
  }

  return {
    type: "resource",
    resource: {
      name: image.name,
      mimeType: image.type,
      // Shared.Resource.blob expects base64-encoded data; this is the base64
      // payload from the `data:` URL.
      blob: image.dataUrl.slice(commaIndex + 1),
    },
  };
}

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

/**
 * Context for thread input state.
 * @internal
 */
export const TamboV1ThreadInputContext = createContext<
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
  const dispatch = useStreamDispatch();

  // Track the previous currentThreadId to detect thread switches
  const prevCurrentThreadIdRef = useRef(streamState.currentThreadId);

  // Reset local threadId when the stream's currentThreadId changes externally
  // (e.g., when user clicks "New Thread" or switches to a different thread)
  useEffect(() => {
    const prevId = prevCurrentThreadIdRef.current;
    const currentId = streamState.currentThreadId;

    if (prevId !== currentId) {
      // Thread changed externally - reset local state to follow stream state
      setThreadId(undefined);
      prevCurrentThreadIdRef.current = currentId;
    }
  }, [streamState.currentThreadId]);

  // Use the current thread from stream state if no explicit threadId is set
  const inheritedThreadId = streamState.currentThreadId ?? undefined;
  const effectiveThreadId = threadId ?? inheritedThreadId;
  // Adopt the returned thread ID if we don't have a real thread ID yet
  // (either no thread, or a temp thread from startNewThread())
  const isNewThread =
    !effectiveThreadId || effectiveThreadId.startsWith("temp_");
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

      const content: InputMessage["content"] = [];

      if (trimmedValue) {
        content.push({ type: "text", text: trimmedValue });
      }

      for (const image of imageState.images) {
        content.push(stagedImageToResourceContent(image));
      }

      const result = await sendMessage.mutateAsync({
        message: {
          role: "user",
          content,
        },
        debug: options?.debug,
      });

      // Clear input and images after successful submission
      setInputValue("");
      imageState.clearImages();

      // Update threadId if a new thread was created (or if we were using a temp thread)
      if (result.threadId && isNewThread) {
        setThreadId(result.threadId);
        // Also update the stream context's currentThreadId so useTamboV1() shows the new thread
        dispatch({ type: "SET_CURRENT_THREAD", threadId: result.threadId });
      }

      return result;
    },
    // `stagedImageToResourceContent` is a pure module-level helper (not a hook value).
    [inputValue, imageState, sendMessage, isNewThread, dispatch],
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
      "useTamboV1ThreadInput must be used within TamboV1ThreadInputProvider",
    );
  }
  return context;
}
