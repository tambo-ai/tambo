"use client";

import { demoComponents } from "@/components/ui/tambo/demo-config";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { useEffect } from "react";
import { MessageThreadFull } from "../ui/tambo/message-thread-full";
import { TamboEmailButton } from "../ui/tambo/tambo-email-button";

export function InteractiveDemo() {
  useEffect(() => {
    const isContextKeySet = localStorage.getItem("tambo-context-key");
    if (!isContextKeySet) {
      const contextKey = new Date().toISOString();
      localStorage.setItem("tambo-context-key", contextKey);
    }
  }, []);

  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
      components={demoComponents}
    >
      <div className="tambo-theme w-full h-full">
        <div className="relative h-full">
          <MessageThreadFull className="shadow-xl max-h-full rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <TamboEmailButton />
            </div>
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
