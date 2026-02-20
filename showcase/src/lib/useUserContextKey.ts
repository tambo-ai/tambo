"use client";

import { useMemo } from "react";

function getOrCreateUserId(storageKey: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  let userId = localStorage.getItem(storageKey);
  if (!userId) {
    userId = `user-${crypto.randomUUID()}`;
    localStorage.setItem(storageKey, userId);
  }
  return userId;
}

/**
 * Custom hook to generate a user-specific context key
 * @param baseKey - The base context key to append the user ID to
 * @param storageKey - Optional localStorage key to store the user ID (defaults to "tambo-user-id")
 * @returns A user-specific context key
 */
export function useUserContextKey(
  baseKey: string,
  storageKey = "tambo-user-id",
): string {
  const userId = useMemo(() => getOrCreateUserId(storageKey), [storageKey]);

  if (!userId) {
    return baseKey;
  }

  return `${baseKey}-${userId}`;
}
