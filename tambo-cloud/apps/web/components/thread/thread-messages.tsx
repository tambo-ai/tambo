import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RouterOutputs } from "@/trpc/react";
import { LegacyComponentDecision } from "@tambo-ai-cloud/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  ActionBadge,
  SuggestedActions,
  ToolCallBadge,
  ToolCallCode,
} from "./message-badges";

type ThreadType = RouterOutputs["thread"]["getThread"];

interface ThreadMessagesProps {
  thread: ThreadType;
}

const roleStyles = {
  system: "bg-[#F8F9FA]",
  assistant: "bg-[#E3F2FD]",
  tool: "bg-[#F3E5F5]",
  user: "bg-[#E8F5E9]",
  "tool-response": "bg-[#FFF3E0]",
} as const;

export function ThreadMessages({ thread }: Readonly<ThreadMessagesProps>) {
  const messages = thread?.messages || [];
  const [highlightedToolCallId, setHighlightedToolCallId] = useState<
    string | null
  >(null);

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const hasMatchingToolCallId =
            message.toolCallId === highlightedToolCallId ||
            message.toolCallRequest?.tool_call_id === highlightedToolCallId ||
            (message.componentDecision as LegacyComponentDecision)
              ?.toolCallId === highlightedToolCallId;

          const isInternalMessage = !!message.actionType;
          const hasToolCallRequest = !!message.toolCallRequest;

          return (
            <motion.div
              key={message.id}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Card
                className={cn(
                  "p-4 transition-all duration-200",
                  roleStyles[message.role as keyof typeof roleStyles],
                  isInternalMessage && "bg-[#F5F5F5] dark:bg-[#2A2A2A]",
                  highlightedToolCallId &&
                    !hasMatchingToolCallId &&
                    "opacity-40",
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {message.role}
                      {message.actionType && (
                        <ActionBadge type={message.actionType} />
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.toolCallId && (
                        <ToolCallBadge
                          id={message.toolCallId}
                          onHover={setHighlightedToolCallId}
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "whitespace-pre-wrap",
                      isInternalMessage && "text-muted-foreground",
                    )}
                  >
                    {typeof message.content === "object" ? (
                      <pre className="max-h-[400px] max-w-full overflow-auto rounded-md bg-[#F8F9FA] dark:bg-[#2A2A2A] p-2">
                        {JSON.stringify(message.content, null, 2)}
                      </pre>
                    ) : (
                      `${message.content}`
                    )}
                  </div>

                  {message.componentDecision?.componentName && (
                    <div className="mt-2 text-sm text-muted-foreground bg-[#F8F9FA] dark:bg-[#2A2A2A] p-3 rounded-md">
                      {message.componentDecision.componentName && (
                        <code className="font-mono">
                          &lt;{message.componentDecision.componentName}
                          {message.componentDecision.props &&
                            ` ${Object.keys(message.componentDecision.props)
                              .map((key) => `${key}={...}`)
                              .join(" ")}`}{" "}
                          /&gt;
                        </code>
                      )}
                    </div>
                  )}

                  {hasToolCallRequest && message.toolCallRequest && (
                    <ToolCallCode
                      toolName={message.toolCallRequest.toolName}
                      parameters={message.toolCallRequest.parameters}
                    />
                  )}

                  {!!message.suggestedActions?.length && (
                    <SuggestedActions actions={message.suggestedActions} />
                  )}

                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-muted-foreground bg-[#F8F9FA] dark:bg-[#2A2A2A] px-2 py-1 rounded-md">
                      {message.id}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
