"use client";

import { Section } from "@/components/section";
import { TamboDemo } from "@/components/ui/tambo/TamboDemo";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";

export function InteractiveDemo() {
  return (
    <Section id="interactive-demo" className="py-16 sm:py-24">
      <div className="w-full">
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_HYDRA_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_HYDRA_API_URL!}
        >
          <TamboDemo />
        </TamboProvider>
      </div>
    </Section>
  );
}
