"use client";

import { useLayoutEffect, useState } from "react";

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
  const [userId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(storageKey) ?? `user-${crypto.randomUUID()}`;
  });

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !userId) {
      return;
    }

    if (localStorage.getItem(storageKey)) {
      return;
    }

    localStorage.setItem(storageKey, userId);
  }, [storageKey, userId]);

  if (!userId) {
    return baseKey;
  }

  return `${baseKey}-${userId}`;
}
