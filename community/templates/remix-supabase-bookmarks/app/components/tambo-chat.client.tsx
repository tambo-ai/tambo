// Client-only Tambo wrapper with full chat experience
import { TamboProvider } from "@tambo-ai/react";
import type { TamboTool } from "@tambo-ai/react";
import { MessageThreadFull } from "./message-thread-full";
import { tamboComponents } from "~/tambo/components";

interface TamboChatProps {
  apiKey: string;
  userToken: string;
  tools: TamboTool[];
}

export function TamboChat({ apiKey, userToken, tools }: TamboChatProps) {
  return (
    <TamboProvider
      apiKey={apiKey}
      userToken={userToken}
      tools={tools}
      components={tamboComponents}
    >
      <div className="flex h-full">
        <MessageThreadFull />
      </div>
    </TamboProvider>
  );
}
