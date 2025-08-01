import { createMarkdownComponents } from "@/components/ui/tambo/markdown-components";
import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy, Info } from "lucide-react";
import { isValidElement, memo, ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import { formatTime } from "../utils";
import { HighlightedJson, HighlightText } from "./highlight";

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
  searchQuery?: string;
}

export const MessageContent = memo(
  ({
    message,
    isUserMessage,
    isHighlighted = false,
    copiedId,
    onCopyId,
    searchQuery,
  }: MessageContentComponentProps) => {
    const [showAdditionalContext, setShowAdditionalContext] = useState(false);
    const safeContent = getSafeContent(message.content as ReactNode);

    // Check if there's additional context to display
    const hasAdditionalContext =
      isUserMessage &&
      message.additionalContext &&
      Object.keys(message.additionalContext).length > 0;

    const formatAdditionalContext = (context: Record<string, any>) => {
      try {
        return JSON.stringify(context, null, 2);
      } catch {
        return String(context);
      }
    };

    // Custom markdown component that highlights search terms
    const createHighlightedMarkdownComponents = () => {
      const baseComponents = createMarkdownComponents();

      if (!searchQuery) return baseComponents;

      return {
        ...baseComponents,
        p: ({ children, ...props }: any) => (
          <p {...props}>
            {typeof children === "string" ? (
              <HighlightText text={children} searchQuery={searchQuery} />
            ) : (
              children
            )}
          </p>
        ),
        li: ({ children, ...props }: any) => (
          <li {...props}>
            {typeof children === "string" ? (
              <HighlightText text={children} searchQuery={searchQuery} />
            ) : (
              children
            )}
          </li>
        ),
        td: ({ children, ...props }: any) => (
          <td {...props}>
            {typeof children === "string" ? (
              <HighlightText text={children} searchQuery={searchQuery} />
            ) : (
              children
            )}
          </td>
        ),
      };
    };

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
            "relative max-w-full sm:max-w-[85%] min-w-0 sm:min-w-[200px] transition-all duration-300 group-hover:shadow-lg rounded-2xl",
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-3 sm:p-5 shadow-sm border backdrop-blur-sm",
              "bg-transparent text-foreground text-sm border-border",
              isHighlighted && "ring-4 ring-theme-accent ring-inset",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/50">{message.role}</span>
              {/* Main content */}
              <div className="text-primary">
                {typeof safeContent === "string" && safeContent ? (
                  searchQuery ? (
                    <ReactMarkdown
                      components={createHighlightedMarkdownComponents()}
                    >
                      {safeContent}
                    </ReactMarkdown>
                  ) : (
                    <ReactMarkdown components={createMarkdownComponents()}>
                      {safeContent}
                    </ReactMarkdown>
                  )
                ) : isValidElement(safeContent) ? (
                  safeContent
                ) : (
                  <span>No content</span>
                )}
              </div>

              {/* Additional Context Section - Only for user messages with context */}
              {hasAdditionalContext && (
                <div className="mt-3 border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      setShowAdditionalContext(!showAdditionalContext)
                    }
                    className="w-full flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium text-xs sm:text-sm text-primary">
                        Additional Context
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyId(
                            formatAdditionalContext(
                              message.additionalContext || {},
                            ),
                          );
                        }}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors"
                      >
                        {copiedId ===
                        formatAdditionalContext(
                          message.additionalContext || {},
                        ) ? (
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                        ) : (
                          <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                        )}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
                          showAdditionalContext && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: showAdditionalContext ? "auto" : 0,
                      opacity: showAdditionalContext ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-background">
                      <pre className="text-xs font-mono text-primary overflow-auto max-h-96">
                        {searchQuery ? (
                          <HighlightedJson
                            json={formatAdditionalContext(
                              message.additionalContext || {},
                            )}
                            searchQuery={searchQuery}
                          />
                        ) : (
                          formatAdditionalContext(
                            message.additionalContext || {},
                          )
                        )}
                      </pre>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <motion.div
          className={cn(
            "flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-foreground px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span
            className="font-medium flex items-center gap-1 cursor-pointer bg-muted/50 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1"
            onClick={() => onCopyId(message.id)}
          >
            <span className="max-w-[100px] sm:max-w-none truncate">
              {message.id}
            </span>
            {copiedId === message.id ? (
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 text-green-500" />
            ) : (
              <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 opacity-50" />
            )}
          </span>
        </motion.div>
      </>
    );
  },
);
MessageContent.displayName = "MessageContent";
