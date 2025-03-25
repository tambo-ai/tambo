"use client";

import { demoComponents } from "@/components/ui/tambo/DemoConfig";
import { MessageThreadFull } from "@/components/ui/tambo/message-thread-full";
import { TamboEmailButton } from "@/components/ui/tambo/TamboEmailButton";
import { env } from "@/lib/env";
import styles from "@/styles/tambo-theme.module.css";
import { TamboProvider } from "@tambo-ai/react";
export default function DemoPage() {
  return (
    <div className={`w-full flex justify-center items-center h-screen`}>
      <div
        className={`w-full flex justify-center items-center bg-white ${styles.tambo_theme}`}
      >
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL!}
          components={demoComponents}
        >
          <MessageThreadFull />
          <TamboEmailButton />
        </TamboProvider>
      </div>
    </div>
  );
}
