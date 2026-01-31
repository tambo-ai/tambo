import { createContext, useContext } from "react";
import type { TamboThread } from "@tambo-ai/react";

export const SyncedThreadContext = createContext<{ thread: TamboThread | null }>({
  thread: null,
});

export function useSyncedThread() {
  const context = useContext(SyncedThreadContext);
  if (!context) {
    throw new Error("useSyncedThread must be used within SyncedThreadProvider");
  }
  return context;
}