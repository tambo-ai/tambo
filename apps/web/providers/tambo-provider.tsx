"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";
import { useEffect, useState } from "react";

const ANONYMOUS_USER_KEY = "tambo-anonymous-user-id";

function useContextKey(userId?: string): string | undefined {
  const [contextKey, setContextKey] = useState<string | undefined>(userId);

  useEffect(() => {
    if (userId) {
      setContextKey(userId);
      return;
    }

    // For unauthenticated users, use a random UUID stored in localStorage
    let anonymousId = localStorage.getItem(ANONYMOUS_USER_KEY);
    if (!anonymousId) {
      anonymousId = crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_USER_KEY, anonymousId);
    }
    setContextKey(anonymousId);
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
