"use client";

import { cn } from "@/lib/utils";
import { useTamboThread } from "@tambo-ai/react";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

export function ChatLayout() {
  const { thread } = useTamboThread();
  const hasMessages = thread?.messages && thread.messages.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6">
      <div className={cn("flex-1 overflow-y-auto scrollbar-hide", !hasMessages && "hidden")}>
        <MessageList />
      </div>
      
      <div className={cn("mt-4 transition-all duration-500", !hasMessages && "flex-1 flex flex-col justify-center")}>
        <ChatInput />
      </div>
    </div>
  );
}
