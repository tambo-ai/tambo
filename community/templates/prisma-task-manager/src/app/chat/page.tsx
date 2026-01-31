"use client";

import ChatClient from "./ChatClient";
import { components, tools } from "../../lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

export default function ChatPage() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
    >
      <ChatClient />
    </TamboProvider>
  );
}
