import React from "react";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./registry";

interface ProviderProps {
  children: React.ReactNode;
}

export function AppTamboProvider({ children }: ProviderProps) {
  return (
    <TamboProvider
      components={components}
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
    >
      {children}
    </TamboProvider>
  );
}
