"use client";

import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import dynamic from "next/dynamic";

// Dynamically import the TamboSubscribeIntegration component with SSR disabled
const TamboSubscribeIntegration = dynamic(
  async () => {
    const mod = await import("./TamboSubscribeIntegration");
    return mod.TamboSubscribeIntegration;
  },
  { ssr: false },
);

export default function SubscribePage() {
  return (
    <TamboProvider
      apiKey={env.NEXT_PUBLIC_HYDRA_API_KEY!}
      tamboUrl={env.NEXT_PUBLIC_HYDRA_API_URL!}
    >
      <div className="container mx-auto py-2">
        <Card className="max-w-2xl mx-auto p-4 mt-2">
          <Icons.logo className="h-6 w-auto mb-4" />
          <p className="text-gray-500 mb-6">
            Fill out our form with your voice.
          </p>
          <TamboSubscribeIntegration />
        </Card>
      </div>
    </TamboProvider>
  );
}
