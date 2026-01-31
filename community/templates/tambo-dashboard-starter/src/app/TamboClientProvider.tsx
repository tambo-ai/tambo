"use client";

import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export default function TamboClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
    >
      {children}
    </TamboProvider>
  );
}