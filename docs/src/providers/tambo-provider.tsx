"use client";

import { currentPageContextHelper, TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export function TamboRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      contextKey="tambo-docs"
      contextHelpers={{ userPage: currentPageContextHelper }}
      components={components}
    >
      {children}
    </TamboProvider>
  );
}
