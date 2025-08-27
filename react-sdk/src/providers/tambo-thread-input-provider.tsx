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
 * @param props - The props for the TamboThreadInputProvider
 * @param props.contextKey - Optional context key.
 * @param props.children - The children to render.
 * @returns The thread input context
 */
export const TamboThreadInputProvider: React.FC<
  PropsWithChildren<TamboThreadInputProviderProps>
> = ({ children, contextKey }) => {
  const { thread, sendThreadMessage } = useTamboThread();
  const { saveDraft, clearDraft, getDraft } = useMessageDraft(
    thread?.id ?? "null_thread",
  );
  const [inputValue, setInputValue] = useState(getDraft());

  React.useEffect(() => {
    setInputValue(getDraft());
  }, [getDraft]);

  const handleSetInputValue = useCallback(
    (value: string) => {
      setInputValue(value);
      saveDraft(value);
    },
    [saveDraft],
  );

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
      clearDraft();
    },
    [inputValue, sendThreadMessage, thread.id, contextKey, clearDraft],
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
    setValue: handleSetInputValue,
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

const DRAFT_KEY = "tambo-user-input";

interface Draft {
  id: string;
  content: string;
  timestamp: number;
}

/**
 * Custom hook to manage the draft of a message input for a thread.
 * Persists the draft to localStorage.
 * @param threadId The ID of the thread for this draft
 * @returns An object with `saveDraft`, `clearDraft`, and `getDraft` functions
 */
function useMessageDraft(threadId: string | null) {
  const getDrafts = React.useCallback((): Draft[] => {
    if (typeof window === "undefined") {
      return [];
    }
    const drafts = localStorage.getItem(DRAFT_KEY);
    return drafts ? JSON.parse(drafts) : [];
  }, []);

  const getDraft = React.useCallback(() => {
    if (typeof window === "undefined" || !threadId) {
      return "";
    }
    const drafts = getDrafts();
    const draft = drafts.find((d) => d.id === threadId);
    return draft ? draft.content : "";
  }, [getDrafts, threadId]);

  const clearDraft = React.useCallback(() => {
    if (typeof window === "undefined" || !threadId) {
      return;
    }
    const drafts = getDrafts();
    const otherDrafts = drafts.filter((d) => d.id !== threadId);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(otherDrafts));
  }, [getDrafts, threadId]);

  const saveDraft = React.useCallback(
    (content: string) => {
      if (typeof window === "undefined" || !threadId) {
        return;
      }

      if (content === "") {
        clearDraft();
        return;
      }

      const drafts = getDrafts();
      const now = Date.now();
      const newDraft: Draft = { id: threadId, content, timestamp: now };
      const otherDrafts = drafts.filter((d) => d.id !== threadId);
      const updatedDrafts = [...otherDrafts, newDraft];
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDrafts));
    },
    [getDrafts, threadId, clearDraft],
  );

  return { saveDraft, clearDraft, getDraft };
}
