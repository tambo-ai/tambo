"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";
import { useEffect, useState } from "react";

const ANONYMOUS_USER_STORAGE_KEY = "tambo-anonymous-user-id";
const USER_PREFIX = "user:";
const ANON_PREFIX = "anon:";

function getOrCreateAnonymousId(): string {
  const existingId = localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, newId);
  return newId;
}

function useContextKey(userId?: string): string | undefined {
  // Initialize with userId if available (server-rendered value)
  const [contextKey, setContextKey] = useState<string | undefined>(
    userId ? `${USER_PREFIX}${userId}` : undefined,
  );

  useEffect(() => {
    if (userId) {
      setContextKey(`${USER_PREFIX}${userId}`);
      return;
    }

    // For unauthenticated users, use a random UUID stored in localStorage
    const anonymousId = getOrCreateAnonymousId();
    setContextKey(`${ANON_PREFIX}${anonymousId}`);
  }, [userId]);

  return contextKey;
}

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
  userId?: string;
}>;

export function TamboProviderWrapper({
  children,
  userId,
}: TamboProviderWrapperProps) {
  const contextKey = useContextKey(userId);

  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_DASH_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={tamboRegisteredComponents}
      contextKey={contextKey}
      contextHelpers={{
        userPage: currentPageContextHelper,
      }}
    >
      {children}
    </TamboProvider>
  );
}
