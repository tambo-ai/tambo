"use client";

import { Message } from "@/components/tambo/message";
import { cn } from "@/lib/utils";
import { type TamboThreadMessage, useTambo } from "@tambo-ai/react";
import * as React from "react";

interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  generationStage?: string;
}

const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent",
    );
  }
  return context;
};

export interface ThreadContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const ThreadContent = React.forwardRef<
  HTMLDivElement,
  ThreadContentProps
>(({ children, className, ...props }, ref) => {
  const { thread, generationStage } = useTambo();

  const contextValue = React.useMemo(
    () => ({
      messages: thread?.messages ?? [],
      generationStage,
    }),
    [thread?.messages, generationStage],
  );

  return (
    <ThreadContentContext.Provider value={contextValue}>
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </ThreadContentContext.Provider>
  );
});

ThreadContent.displayName = "ThreadContent";

export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

export const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages } = useThreadContentContext();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system" && !message.parentMessageId,
  );

  return (
    <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
      {filteredMessages.map((message, index) => {
        return (
          <div
            key={
              message.id ??
              `${message.role}-${message.createdAt ?? `${index}`}-${message.content?.toString().substring(0, 10)}`
            }
          >
            <Message
              role={message.role === "user" ? "user" : "assistant"}
              message={message}
            />
          </div>
        );
      })}
    </div>
  );
});

ThreadContentMessages.displayName = "ThreadContentMessages";
