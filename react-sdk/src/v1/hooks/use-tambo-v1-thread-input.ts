"use client";

/**
 * useTamboV1ThreadInput - Thread Input Hook for v1 API
 *
 * Manages thread input state and message submission, mirroring
 * the beta SDK's useTamboThreadInput API.
 */

import { useCallback, useState } from "react";
import { useTamboV1SendMessage } from "./use-tambo-v1-send-message";

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
 * Return type for useTamboV1ThreadInput hook
 */
export interface UseTamboV1ThreadInputReturn {
  /**
   * Current value of the input field
   */
  value: string;

  /**
   * Function to update the input value
   */
  setValue: React.Dispatch<React.SetStateAction<string>>;

  /**
   * Function to submit the current input value.
   * Clears the input on successful submission.
   * Returns the threadId (may be undefined if stream ended before receiving it).
   */
  submit: (
    options?: SubmitOptions,
  ) => Promise<{ threadId: string | undefined }>;

  /**
   * Whether a message is currently being submitted
   */
  isPending: boolean;

  /**
   * Whether the last submission resulted in an error
   */
  isError: boolean;

  /**
   * The error from the last submission, if any
   */
  error: Error | null;

  /**
   * Whether the submission was successful
   */
  isSuccess: boolean;

  /**
   * Reset the mutation state
   */
  reset: () => void;
}

/**
 * Hook to manage thread input state and message submission.
 *
 * Provides a similar API to the beta SDK's useTamboThreadInput,
 * managing input value state and providing a submit function.
 * @param threadId - Optional thread ID to send messages to. If not provided, creates new thread
 * @returns Thread input state and submit function
 * @example
 * ```tsx
 * function ChatInput({ threadId }: { threadId?: string }) {
 *   const { value, setValue, submit, isPending } = useTamboV1ThreadInput(threadId);
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     const result = await submit();
 *     console.log('Sent to thread:', result.threadId);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={value}
 *         onChange={(e) => setValue(e.target.value)}
 *         disabled={isPending}
 *       />
 *       <button type="submit" disabled={isPending || !value.trim()}>
 *         Send
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useTamboV1ThreadInput(
  threadId?: string,
): UseTamboV1ThreadInputReturn {
  const [value, setValue] = useState("");
  const mutation = useTamboV1SendMessage(threadId);

  const submit = useCallback(
    async (options?: SubmitOptions) => {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        throw new Error("Message cannot be empty");
      }

      const result = await mutation.mutateAsync({
        message: {
          role: "user",
          content: [{ type: "text", text: trimmedValue }],
        },
        debug: options?.debug,
      });

      // Clear input on successful submission
      setValue("");

      return result;
    },
    [value, mutation],
  );

  return {
    value,
    setValue,
    submit,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
