"use client";

import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { TamboSubscribeIntegration } from "./tambo-subscribe-integration";

export default function SubscribePage() {
  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
    >
      <div className="container mx-auto py-2">
        <TamboSubscribeIntegration />
      </div>
    </TamboProvider>
  );
}
