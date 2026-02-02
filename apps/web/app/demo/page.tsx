"use client";

import { demoComponents } from "@/components/ui/tambo/demo-config";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import { TamboEmailButton } from "@/components/ui/tambo/tambo-email-button";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
export default function DemoPage() {
  return (
    <div className="w-full flex justify-center items-center h-screen">
      <div className="w-full flex justify-center items-center bg-white">
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
          components={demoComponents}
        >
          <MessageThreadFull />
          <TamboEmailButton />
        </TamboProvider>
      </div>
    </div>
  );
}
