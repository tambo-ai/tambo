"use client";

import { useCallback, useEffect, useState } from "react";
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

const setDrafts = (storageKey: string, drafts: Draft[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(drafts));
  } catch (e) {
    console.error("Failed to persist drafts", e);
  }
};

/**
 * This internal hook is used to manage the draft of a message input for a thread.
 *
 * Persists the draft to localStorage.
 *
 * This hook is used by the TamboThreadInputProvider.
 * @param threadId The ID of the thread for this draft
 * @param storageKey The storage key for drafts (optional)
 * @returns An object with `currentDraft` and `saveDraft`
 */
export function useTamboMessageDrafts(
  threadId?: string,
  storageKey = DRAFT_KEY,
) {
  const [currentDraft, setCurrentDraft] = useState<string>("");

  const persistDraft = useDebouncedCallback(
    (content: string, threadId?: string) => {
      if (typeof window === "undefined" || !threadId) {
        return;
      }

      const drafts = getDrafts(storageKey);
      const otherDrafts = drafts.filter((d) => d.id !== threadId);

      if (content.trim() === "") {
        setDrafts(storageKey, otherDrafts);
        return;
      }

      const now = Date.now();
      const newDraft: Draft = {
        id: threadId,
        content,
        timestamp: now,
      };
      const updatedDrafts = [...otherDrafts, newDraft];
      setDrafts(storageKey, updatedDrafts);
    },
    300,
  );

  const saveDraft = useCallback(
    (content: string) => {
      setCurrentDraft(content);
      persistDraft(content, threadId);
    },
    [persistDraft, threadId],
  );

  // Update draft when threadId changes
  useEffect(() => {
    if (threadId) {
      const draft =
        getDrafts(storageKey).find((d) => d.id === threadId)?.content ?? "";
      setCurrentDraft(draft);
    }
  }, [threadId, storageKey]);

  return { currentDraft, saveDraft };
}
