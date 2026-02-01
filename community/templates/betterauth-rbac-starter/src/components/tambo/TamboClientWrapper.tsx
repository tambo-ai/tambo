"use client";

import { TamboProvider, type TamboComponent } from "@tambo-ai/react";
import { createTools, tamboComponents } from "@/lib/tools";

import { useMemo } from "react";

interface TamboClientWrapperProps {
  children: React.ReactNode;
  apiKey: string;
  userToken: string;
  role: "admin" | "user";
}

export function TamboClientWrapper({
  children,
  apiKey,
  userToken,
  role,
}: TamboClientWrapperProps) {
  // Generate tools with baked-in role security
  // PRO TIP: Memoize this to prevent TamboProvider from reloading/re-authing on every render
  const activeTools = useMemo(() => createTools(role), [role]);

  return (
    <TamboProvider
      apiKey={apiKey}
      tools={activeTools}
      components={tamboComponents as TamboComponent[]}
      userToken={userToken}
    >
      {children}
    </TamboProvider>
  );
}
