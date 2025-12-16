"use client";

import { env } from "@/lib/env";
import { tamboRegisteredComponents } from "@/lib/tambo/config";
import { TamboProvider, currentPageContextHelper } from "@tambo-ai/react";
import { useState } from "react";

type TamboProviderWrapperProps = Readonly<{
  children: React.ReactNode;
}>;

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  // Generate or retrieve contextKey only once on mount
  const [contextKey] = useState<string>(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window === "undefined") {
      return `session-${crypto.randomUUID()}`;
    }
    const stored = localStorage.getItem("tambo-context-key");
    if (stored) return stored;
    const newKey = `session-${crypto.randomUUID()}`;
    localStorage.setItem("tambo-context-key", newKey);
    return newKey;
  });

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
