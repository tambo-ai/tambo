"use client";

import { Section } from "@/components/section";
import { demoComponents } from "@/components/ui/tambo/DemoConfig";
import { env } from "@/lib/env";
import { TamboProvider } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { MessageThreadFull } from "../ui/tambo/message-thread-full";
import { TamboEmailButton } from "../ui/tambo/TamboEmailButton";

const ease = [0.16, 1, 0.3, 1];

export function InteractiveDemo() {
  return (
    <Section id="interactive-demo" className="py-8 sm:py-12 md:py-16 lg:py-20">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1.6, ease }}
      >
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL!}
          components={demoComponents}
        >
          <div className="tambo-theme w-full">
            <div className="relative">
              <MessageThreadFull className="mx-auto shadow-xl" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <TamboEmailButton />
                </div>
              </div>
            </div>
          </div>
        </TamboProvider>
      </motion.div>
    </Section>
  );
}
