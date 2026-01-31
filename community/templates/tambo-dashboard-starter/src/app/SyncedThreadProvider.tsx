"use client";

import { useState, useEffect } from "react";
import { useTamboThread } from "@tambo-ai/react";
import { SyncedThreadContext } from "@/lib/useSyncedThread";

export function SyncedThreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { thread } = useTamboThread();
  const [syncedThread, setSyncedThread] = useState(thread);

  useEffect(() => {
    setSyncedThread(thread);
  }, [thread]);

  return (
    <SyncedThreadContext.Provider value={{ thread: syncedThread }}>
      {children}
    </SyncedThreadContext.Provider>
  );
}