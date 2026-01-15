import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Settings, XCircle } from "lucide-react";
import { memo } from "react";
import {
  formatTime,
  formatToolParameters,
  formatToolResponseContent,
} from "../utils";
import { HighlightText } from "./highlight";
import { MessageIdCopyButton } from "./message-id-copy-button";
import { ToolArgumentsSection } from "./tool-arguments-section";
import { ToolResponseSection } from "./tool-response-section";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ToolCallMessageProps {
  message: MessageType;
  toolResponse?: MessageType;
  isHighlighted?: boolean;
  searchQuery?: string;
}

export const ToolCallMessage = memo(
  ({
    message,
    toolResponse,
    isHighlighted = false,
    searchQuery,
  }: ToolCallMessageProps) => {
    const toolName = message.toolCallRequest?.toolName || "Unknown Tool";
    const parameters = message.toolCallRequest?.parameters || [];

    // Check for errors
    const hasToolCallError = message.error;
    const hasToolResponseError =
      toolResponse?.role === "tool" && toolResponse?.error;
    const hasAnyError = hasToolCallError || hasToolResponseError;

    return (
      <>
        {/* Top metadata bar */}
        <motion.div
          className="flex items-center gap-3 mb-3 px-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 text-xs text-foreground">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </motion.div>

        {/* Tool Call Message bubble */}
        <motion.div
          className="relative max-w-full sm:max-w-[85%] min-w-0 sm:min-w-[200px] transition-all duration-300 group-hover:shadow-lg rounded-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-3 sm:p-5 shadow-sm border backdrop-blur-sm",
              "bg-muted/20 text-foreground text-sm border-border",
              isHighlighted && "ring-4 ring-theme-accent ring-inset",
              hasAnyError && "border-red-200 bg-red-50/50",
            )}
          >
            <div className="flex flex-col gap-2 sm:gap-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                {hasAnyError ? (
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                ) : (
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span
                  className={cn(
                    "text-xs sm:text-sm font-semibold text-primary",
                    hasAnyError && "text-red-700",
                  )}
                >
                  Tool Call:{" "}
                  {searchQuery ? (
                    <HighlightText text={toolName} searchQuery={searchQuery} />
                  ) : (
                    <span className="font-normal">{toolName}</span>
                  )}
                </span>
              </div>

              {/* View Arguments Dropdown */}
              <ToolArgumentsSection
                parameters={
                  parameters as {
                    parameterName: string;
                    parameterValue: string;
                  }[]
                }
                formatToolParameters={formatToolParameters}
                searchQuery={searchQuery}
              />

              {/* View Response Dropdown */}
              {toolResponse && (
                <ToolResponseSection
                  toolResponse={toolResponse}
                  formatToolResponseContent={formatToolResponseContent}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <MessageIdCopyButton messageId={message.id} />
      </>
    );
  },
);

ToolCallMessage.displayName = "ToolCallMessage";
