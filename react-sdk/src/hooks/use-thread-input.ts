import { UseMutationResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { ThreadInputError } from "../model/thread-input-error";
import { validateInput } from "../model/validate-input";
import { useTamboThread } from "../providers/tambo-thread-provider";
import { useTamboMutation } from "./react-query-hooks";

/**
 * Error messages for various input-related error scenarios
 * These messages are used to provide user-friendly error feedback
 * @readonly
 */
export const INPUT_ERROR_MESSAGES = {
  /** Error when attempting to submit empty input */
  EMPTY: "Message cannot be empty",
  /** Error when network connection fails */
  NETWORK: "Network error. Please check your connection",
  /** Error when server fails to process the request */
  SERVER: "Server error. Please try again",
  /** Error when input format is invalid */
  VALIDATION: "Invalid message format",
} as const;

/**
 * Interface for the thread input hook return value
 * Provides all necessary functions and state for managing thread input
 */
interface UseThreadInputInternal {
  /** Current value of the input field */
  value: string;
  /**
   * Function to update the input value
   * @param value - New value for the input field
   */
  setValue: (value: string) => void;
  /**
   * Function to submit the current input value
   * Validates input, handles errors, and cleans up state after submission
   * @throws {ThreadInputError} If submission fails
   * @returns Promise that resolves when submission is complete
   */
  submit: (options?: {
    contextKey?: string;
    streamResponse?: boolean;
    forceToolChoice?: string;
  }) => Promise<void>;
}
export type UseThreadInput = UseThreadInputInternal &
  UseMutationResult<
    void,
    Error,
    { contextKey?: string; streamResponse?: boolean; forceToolChoice?: string }
  >;

/**
 * Hook for managing thread message input state and submission
 * @returns Interface for managing thread input state and submission
 */
export function useTamboThreadInput(contextKey?: string): UseThreadInput {
  const { thread, inputValue, setInputValue, sendThreadMessage } =
    useTamboThread();

  const submit = useCallback(
    async ({
      contextKey: submitContextKey,
      streamResponse,
      forceToolChoice,
    }: {
      contextKey?: string;
      streamResponse?: boolean;
      forceToolChoice?: string;
    } = {}) => {
      const validation = validateInput(inputValue);
      if (!validation.isValid) {
        throw new ThreadInputError(
          `Cannot submit message: ${validation.error ?? INPUT_ERROR_MESSAGES.VALIDATION}`,
          { cause: validation.error },
        );
      }

      await sendThreadMessage(validation.sanitizedInput, {
        threadId: thread.id,
        contextKey: submitContextKey ?? contextKey ?? undefined,
        streamResponse: streamResponse,
        forceToolChoice: forceToolChoice,
      });
      setInputValue("");
    },
    [inputValue, sendThreadMessage, thread.id, contextKey, setInputValue],
  );
  const {
    mutateAsync: submitAsync,
    mutate: _unusedSubmit,
    ...mutationState
  } = useTamboMutation({
    mutationFn: submit,
  });

  return {
    ...mutationState,
    value: inputValue,
    setValue: setInputValue,
    submit: submitAsync,
  } as UseThreadInput;
}
