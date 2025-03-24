"use client";

import { Section } from "@/components/section";
import { demoComponents } from "@/components/ui/tambo/DemoConfig";
import { TamboDemo } from "@/components/ui/tambo/TamboDemo";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";

export function InteractiveDemo() {
  return (
    <Section id="interactive-demo" className="py-16 sm:py-24">
      <div className="w-full">
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL!}
          components={demoComponents}
        >
          <TamboDemo />
        </TamboProvider>
      </div>
    </Section>
  );
}
