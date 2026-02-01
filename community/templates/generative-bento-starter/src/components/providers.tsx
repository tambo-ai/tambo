"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TamboProvider
        tools={tools}
        components={components}
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
      >
        {children}
      </TamboProvider>
    </ThemeProvider>
  );
}
