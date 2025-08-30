"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const DRAFT_KEY = "tambo-message-drafts";

interface Draft {
  id: string;
  content: string;
  timestamp: number;
}

const getDrafts = (): Draft[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const existingDrafts = localStorage.getItem(DRAFT_KEY);
    return existingDrafts ? JSON.parse(existingDrafts) : [];
  } catch {
    return [];
  }
};

/**
 * This internal hook is used to manage the draft of a message input for a thread.
 *
 * Persists the draft to localStorage.
 *
 * This hook is used by the TamboThreadInputProvider.
 * @param threadId The ID of the thread for this draft
 * @returns An object with `currentDraft` and `saveDraft`
 */
export function useTamboMessageDrafts(threadId: string | null) {
  const [currentDraft, setCurrentDraft] = useState<string>("");
  const isInitialLoad = useRef(true);

  // Load initial draft for the thread
  useEffect(() => {
    isInitialLoad.current = true; // Set flag on threadId change
    if (typeof window === "undefined" || !threadId) {
      setCurrentDraft("");
      return;
    }

    const drafts = getDrafts();
    const draft = drafts.find((d) => d.id === threadId);
    setCurrentDraft(draft ? draft.content : "");
  }, [threadId]);

  const persistDraft = useDebouncedCallback(
    (threadId: string, content: string) => {
      if (typeof window === "undefined") {
        return;
      }

      const drafts = getDrafts();
      const otherDrafts = drafts.filter((d) => d.id !== threadId);

      if (content === "") {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(otherDrafts));
        } catch (e) {
          console.error("Failed to clear draft", e);
        }
        return;
      }

      const now = Date.now();
      const newDraft: Draft = {
        id: threadId,
        content,
        timestamp: now,
      };
      const updatedDrafts = [...otherDrafts, newDraft];

      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDrafts));
      } catch (e) {
        console.error("Failed to persist draft", e);
      }
    },
    300,
  );

  // Persist draft to local storage on change
  useEffect(() => {
    // Do not persist on initial load or when threadId changes
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (threadId) {
      persistDraft(threadId, currentDraft);
    }
  }, [threadId, currentDraft, persistDraft]);

  const saveDraft = useCallback((content: string) => {
    setCurrentDraft(content);
  }, []);

  return { currentDraft, saveDraft };
}
