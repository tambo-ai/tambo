"use client";

import { Section } from "@/components/section";
import { demoComponents } from "@/components/ui/tambo/DemoConfig";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "../ui/tambo/message-thread-full";
import { TamboEmailButton } from "../ui/tambo/TamboEmailButton";

export function InteractiveDemo() {
  return (
    <Section
      id="interactive-demo"
      className="py-12 sm:py-16 md:py-20 overflow-hidden"
    >
      <div className="container px-4 mx-auto">
        <div className="mx-auto">
          <TamboProvider
            apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
            tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL!}
            components={demoComponents}
          >
            <div className="tambo_theme w-full">
              <div className="relative w-full mx-auto">
                <MessageThreadFull className="mx-auto shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="pointer-events-auto">
                    <TamboEmailButton />
                  </div>
                </div>
              </div>
            </div>
          </TamboProvider>
        </div>
      </div>
    </Section>
  );
}
