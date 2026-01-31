"use client";

import { TamboProvider } from "@tambo-ai/react";
import { components } from "./components";
import { tools } from "./tools";

/**
 * TamboWrapper
 *
 * Wraps the application with TamboProvider, registering:
 * - Generative components (AI decides which to render)
 * - Tools (client-side functions AI can call)
 *
 * Architecture:
 * 1. AI Layer (Tambo) - Interprets user intent, selects components, generates props
 * 2. Logic Layer (Tools) - Pure algorithm logic, no UI
 * 3. UI Layer (Components) - Render based on props, no business logic
 */
export function TamboWrapper({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md p-6 rounded-xl border border-red-500/50 bg-red-500/10">
          <h2 className="text-lg font-semibold text-red-500 mb-2">
            Missing API Key
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Tambo API key to <code>.env.local</code>:
          </p>
          <pre className="p-3 rounded bg-muted text-xs overflow-x-auto">
            NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
          </pre>
          <p className="text-xs text-muted-foreground mt-4">
            Get your API key at{" "}
            <a
              href="https://app.tambo.co"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              app.tambo.co
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      components={components}
      tools={tools}
    >
      {children}
    </TamboProvider>
  );
}
