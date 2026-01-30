"use client";

import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
    >
      {children}
    </TamboProvider>
  );
}
