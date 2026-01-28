// This file is client-only (.client.tsx suffix) to avoid SSR issues
// with @tambo-ai/react's dependency on react-media-recorder
import { TamboProvider } from "@tambo-ai/react";
import type { TamboTool } from "@tambo-ai/react";
import { ChatPanel } from "./chat-panel";
import { tamboComponents } from "~/tambo/components";

interface TamboChatProps {
  apiKey: string;
  tools: TamboTool[];
}

export function TamboChat({ apiKey, tools }: TamboChatProps) {
  return (
    <TamboProvider 
      apiKey={apiKey} 
      tools={tools}
      components={tamboComponents}
    >
      <ChatPanel />
    </TamboProvider>
  );
}
