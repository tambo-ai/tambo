"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const DRAFT_KEY = "tambo-message-drafts";

interface Draft {
  id: string;
  content: string;
  timestamp: number;
}

const getDrafts = (storageKey: string): Draft[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const existingDrafts = localStorage.getItem(storageKey);
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
export function useTamboMessageDrafts({
  storageKey = DRAFT_KEY,
  threadId,
}: {
  storageKey?: string;
  threadId?: string;
}) {
  const [currentDraft, setCurrentDraft] = useState<string>(
    getDrafts(storageKey).find((d) => d.id === threadId)?.content ?? "",
  );

  const persistDraft = useDebouncedCallback((content: string) => {
    if (typeof window === "undefined" || !threadId) {
      return;
    }

    const drafts = getDrafts(storageKey);
    const otherDrafts = drafts.filter((d) => d.id !== threadId);

    if (content === "") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(otherDrafts));
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
      localStorage.setItem(storageKey, JSON.stringify(updatedDrafts));
    } catch (e) {
      console.error("Failed to persist draft", e);
    }
  }, 300);

  // Persist draft to local storage on change
  useEffect(() => {
    persistDraft(currentDraft);
  }, [persistDraft, currentDraft]);

  return { currentDraft, saveDraft: setCurrentDraft };
}
