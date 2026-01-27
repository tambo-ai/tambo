"use client";

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
  return (
    <TamboProvider
      userToken={userToken}
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
    >
      {children}
    </TamboProvider>
  );
}
