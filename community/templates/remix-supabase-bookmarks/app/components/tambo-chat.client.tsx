// Client-only Tambo wrapper with full chat experience
import { TamboProvider } from "@tambo-ai/react";
import type { TamboTool } from "@tambo-ai/react";
import { MessageThreadFull } from "./message-thread-full";
import { tamboComponents } from "~/tambo/components";

interface TamboChatProps {
  apiKey: string;
  tools: TamboTool[];
}

export function TamboChat({ apiKey, tools }: TamboChatProps) {
  return (
    <TamboProvider apiKey={apiKey} tools={tools} components={tamboComponents}>
      <div className="flex h-full">
        <MessageThreadFull />
      </div>
    </TamboProvider>
  );
}
