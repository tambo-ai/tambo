"use client";

import { useEffect, useState } from "react";

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
  const [userContextKey, setUserContextKey] = useState<string>(baseKey);

  useEffect(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      // Try to get existing user ID from localStorage
      let userId = localStorage.getItem(storageKey);

      // If no user ID exists, create a new one
      if (!userId) {
        userId = `user-${crypto.randomUUID()}`;
        localStorage.setItem(storageKey, userId);
      }

      // Combine base context key with user ID
      setUserContextKey(`${baseKey}-${userId}`);
    }
  }, [baseKey, storageKey]);

  return userContextKey;
}
