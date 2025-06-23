import { createMarkdownComponents } from "@/components/ui/tambo/markdownComponents";
import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { isValidElement, memo, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { formatTime } from "../utils";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface MessageContentProps {
  message: MessageType;
  isUserMessage: boolean;
  isHighlighted?: boolean;
}

interface MessageContentComponentProps extends MessageContentProps {
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

export const MessageContent = memo(
  ({
    message,
    isUserMessage,
    isHighlighted = false,
    copiedId,
    onCopyId,
  }: MessageContentComponentProps) => {
    const safeContent = getSafeContent(message.content as ReactNode);

    return (
      <>
        {/* Top metadata bar */}
        <motion.div
          className={cn(
            "flex items-center gap-3 mb-3 px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 text-xs text-foreground">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </motion.div>

        {/* Message bubble */}
        <motion.div
          className={cn(
            "relative max-w-[85%] min-w-[200px] transition-all duration-300 group-hover:shadow-lg rounded-2xl",
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border backdrop-blur-sm",
              "bg-transparent text-foreground text-sm border-border",
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/50">{message.role}</span>
              {/* Main content */}
              <div className="text-primary">
                {typeof safeContent === "string" && safeContent ? (
                  <ReactMarkdown components={createMarkdownComponents()}>
                    {safeContent}
                  </ReactMarkdown>
                ) : isValidElement(safeContent) ? (
                  safeContent
                ) : (
                  <span>No content</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <motion.div
          className={cn(
            "flex items-center gap-2 mt-2 text-[11px] text-foreground px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span
            className="font-medium flex items-center gap-1 cursor-pointer bg-muted/50 rounded-md px-2 py-1"
            onClick={() => onCopyId(message.id)}
          >
            {message.id}
            {copiedId === message.id ? (
              <Check className="h-3 w-3 ml-1 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 ml-1 opacity-50" />
            )}
          </span>
        </motion.div>
      </>
    );
  },
);
MessageContent.displayName = "MessageContent";
