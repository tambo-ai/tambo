"use client";

/**
 * TamboThreadInputProvider - Shared Thread Input Context
 *
 * Provides shared input state across all components, enabling features like
 * suggestions to update the input field directly.
 *
 * This mirrors the TamboThreadInputProvider pattern from the legacy beta SDK.
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
import { useTamboSendMessage } from "../hooks/use-tambo-v1-send-message";
import type { InputMessage } from "../types/message";
import type { ToolChoice } from "../types/tool-choice";
import { isPlaceholderThreadId } from "../utils/event-accumulator";
import { useTamboAuthState } from "../hooks/use-tambo-v1-auth-state";
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

  /**
   * How the model should use tools. Defaults to "auto".
   * - "auto": Model decides whether to use tools
   * - "required": Model must use at least one tool
   * - "none": Model cannot use tools
   * - { name: "toolName" }: Model must use the specified tool
   */
  toolChoice?: ToolChoice;
}

/**
 * Context props for thread input state
 */
export interface TamboThreadInputContextProps extends Omit<
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

  /** Current thread ID being used for input (from stream state) */
  threadId: string | undefined;

  /** Whether the input should be disabled (pending submission or not authenticated) */
  isDisabled: boolean;
}

/**
 * Context for thread input state.
 * @internal
 */
export const TamboThreadInputContext = createContext<
  TamboThreadInputContextProps | undefined
>(undefined);

/**
 * Provider that manages shared thread input state across all components.
 *
 * This ensures that useTamboThreadInput, useTamboSuggestions, and other components
 * all share the same input state.
 * @param props - Provider props
 * @param props.children - Child components
 * @returns Thread input context provider
 */
export function TamboThreadInputProvider({ children }: PropsWithChildren) {
  const [inputValue, setInputValue] = useState("");
  const imageState = useMessageImages();
  const streamState = useStreamState();
  const dispatch = useStreamDispatch();
  const authState = useTamboAuthState();

  // Use the current thread from stream state directly
  // Placeholder ID indicates a new thread should be created
  const currentThreadId = streamState.currentThreadId ?? undefined;
  const isNewThread = isPlaceholderThreadId(currentThreadId);
  const sendMessage = useTamboSendMessage(currentThreadId);

  const isIdentified = authState.status === "identified";

  const submitFn = useCallback(
    async (
      options?: SubmitOptions,
    ): Promise<{ threadId: string | undefined }> => {
      if (!isIdentified) {
        throw new Error(
          "Cannot submit: authentication is not ready. " +
            "Ensure a valid userKey or userToken is provided.",
        );
      }

      const trimmedValue = inputValue.trim();
      const valueAtSubmitTime = inputValue;
      const imageIdsAtSubmitTime = imageState.images.map((image) => image.id);

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

      // Optimistically clear submitted text so users can start typing the next
      // message immediately while the current request is pending.
      setInputValue("");

      try {
        const result = await sendMessage.mutateAsync({
          message: {
            role: "user",
            content,
          },
          userMessageText: trimmedValue, // Pass text for optimistic display
          debug: options?.debug,
          toolChoice: options?.toolChoice,
        });

        // Clear only submitted images so images added while pending are kept.
        if (imageIdsAtSubmitTime.length > 0) {
          imageIdsAtSubmitTime.forEach((id) => {
            imageState.removeImage(id);
          });
        }

        // Update stream context's currentThreadId if a new thread was created
        if (result.threadId && isNewThread) {
          dispatch({ type: "SET_CURRENT_THREAD", threadId: result.threadId });
        }

        return result;
      } catch (error) {
        // If the user has not started typing a new message, restore the
        // submitted value so failed sends don't silently lose input.
        setInputValue((currentValue) =>
          currentValue.length > 0 ? currentValue : valueAtSubmitTime,
        );
        throw error;
      }
    },
    // `stagedImageToResourceContent` is a pure module-level helper (not a hook value).
    [inputValue, imageState, sendMessage, isNewThread, dispatch, isIdentified],
  );

  const {
    mutateAsync: submitAsync,
    mutate: _unusedSubmit,
    ...mutationState
  } = useTamboMutation({
    mutationKey: ["v1-thread-input", currentThreadId],
    mutationFn: submitFn,
  });

  const contextValue: TamboThreadInputContextProps = {
    ...mutationState,
    value: inputValue,
    setValue: setInputValue,
    submit: submitAsync,
    images: imageState.images,
    addImage: imageState.addImage,
    addImages: imageState.addImages,
    removeImage: imageState.removeImage,
    clearImages: imageState.clearImages,
    threadId: currentThreadId,
    isDisabled: mutationState.isPending || !isIdentified,
  };

  return (
    <TamboThreadInputContext.Provider value={contextValue}>
      {children}
    </TamboThreadInputContext.Provider>
  );
}

/**
 * Hook to access the shared thread input state.
 *
 * All components using this hook share the same input state, enabling
 * features like suggestions to update the input field directly.
 * @returns The shared thread input context
 * @throws {Error} If used outside TamboThreadInputProvider
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { value, setValue, submit, isPending } = useTamboThreadInput();
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
export function useTamboThreadInput(): TamboThreadInputContextProps {
  const context = useContext(TamboThreadInputContext);
  if (!context) {
    throw new Error(
      "useTamboThreadInput must be used within TamboThreadInputProvider",
    );
  }
  return context;
}
