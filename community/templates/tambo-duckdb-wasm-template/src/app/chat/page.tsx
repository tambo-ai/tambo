"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="h-screen">
        <MessageThreadFull contextKey="tambo-template" />
      </div>
    </TamboProvider>
  );
}
