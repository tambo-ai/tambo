"use client";

import { ReactNode } from "react";

export function ApiKeyCheck({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-primary font-bold">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tighter">API Key Required</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To use the Hono Intelligence interface, please add your 
              <code className="mx-1 px-1 py-0.5 bg-secondary rounded border border-border text-primary font-mono text-[11px]">
                NEXT_PUBLIC_TAMBO_API_KEY
              </code> 
              to your <code className="font-mono text-[11px]">.env.local</code> file.
            </p>
          </div>
          <a 
            href="https://tambo.co" 
            target="_blank"
            className="inline-block text-xs font-bold text-primary hover:underline"
          >
            Get a free key at tambo.co →
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}