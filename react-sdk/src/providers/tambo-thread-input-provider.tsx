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
import { ThreadInputError } from "../model/thread-input-error";
import { validateInput } from "../model/validate-input";
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
 * @param contextKey - Optional context key.
 * @returns The thread input context
 */
export const TamboThreadInputProvider: React.FC<
  PropsWithChildren<TamboThreadInputProviderProps>
> = ({ children, contextKey }) => {
  const { thread, sendThreadMessage } = useTamboThread();
  const [inputValue, setInputValue] = useState("");

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
        additionalContext: additionalContext,
      });
      setInputValue(""); // Clear local state
    },
    [inputValue, sendThreadMessage, thread.id, contextKey],
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
