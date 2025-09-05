"use client";

import {
  currentPageContextHelper,
  TamboProvider as TamboProviderBase,
} from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export function TamboProvider({ children }: { children: React.ReactNode }) {
  return (
    <TamboProviderBase
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL!}
      contextHelpers={{ userPage: currentPageContextHelper }}
      components={components}
    >
      {children}
    </TamboProviderBase>
  );
}
