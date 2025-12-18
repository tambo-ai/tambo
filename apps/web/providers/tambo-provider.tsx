"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";
import type { User } from "next-auth";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  const { data: session } = useSession();

  // Generate or retrieve contextKey only once on mount (for unauthenticated users)
  const [anonymousKey] = useState<string | undefined>(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window === "undefined") {
      return undefined;
    }
    const stored = localStorage.getItem("tambo-context-key");
    if (stored) return stored;
    const newKey = `session-${crypto.randomUUID()}`;
    localStorage.setItem("tambo-context-key", newKey);
    return newKey;
  });

  // Use session.user.id when logged in, otherwise use anonymous key
  const contextKey = useMemo(
    () =>
      (session?.user as User | undefined)?.id ?? anonymousKey ?? "anonymous",
    [session?.user, anonymousKey],
  );

  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_DASH_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={tamboRegisteredComponents}
      contextHelpers={{
        userPage: currentPageContextHelper,
      }}
      contextKey={contextKey}
    >
      {children}
    </TamboProvider>
  );
}
