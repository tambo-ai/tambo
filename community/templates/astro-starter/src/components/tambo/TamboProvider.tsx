"use client";

import React from "react";
import { TamboProvider as Provider } from "@tambo-ai/react";
import { components, tools } from "../../lib/tambo";

interface TamboProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes the Tambo SDK.
 * Configures the API key, registered components, tools, and streaming settings.
 * Must wrap any component using Tambo hooks.
 */
export function TamboProvider({ children }: TamboProviderProps) {
  const apiKey = import.meta.env.PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    console.warn(
      "Tambo API key not found. Please set PUBLIC_TAMBO_API_KEY in your .env file",
    );
  }

  return (
    <Provider
      apiKey={apiKey || ""}
      components={components}
      tools={tools}
      streaming={true}
      autoGenerateThreadName={true}
      autoGenerateNameThreshold={1}
    >
      {children}
    </Provider>
  );
}
