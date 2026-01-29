"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { components, tools } from "@/lib/tambo";
import { ClerkProvider } from "@clerk/nextjs";
import { TamboProvider } from "@tambo-ai/react";
import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
  userToken?: string;
}

export default function ClientLayout({
  children,
  userToken,
}: ClientLayoutProps) {
  if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_TAMBO_API_KEY) {
    console.error(
      "❌ Missing NEXT_PUBLIC_TAMBO_API_KEY in environment variables",
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider>
        <TamboProvider
          apiKey={(process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? "").trim()}
          userToken={userToken}
          components={components}
          tools={tools}
        >
          {children}
        </TamboProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
