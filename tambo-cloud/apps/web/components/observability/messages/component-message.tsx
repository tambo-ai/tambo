import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
import { memo } from "react";
import { formatTime } from "../utils";
import { ComponentPropsSection } from "./component-props-section";
import { HighlightText } from "./highlight";
import { MessageIdCopyButton } from "./message-id-copy-button";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ComponentMessageProps {
  message: MessageType;
  isHighlighted?: boolean;
  searchQuery?: string;
}

export const ComponentMessage = memo(
  ({ message, isHighlighted = false, searchQuery }: ComponentMessageProps) => {
    const componentName =
      message.componentDecision?.componentName || "Unknown Component";
    const componentProps = message.componentDecision?.props || {};

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

        {/* Component Message bubble */}
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
            )}
          >
            <div className="flex flex-col gap-2 sm:gap-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  UI Component:{" "}
                  {searchQuery ? (
                    <HighlightText
                      text={componentName}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <span className="font-normal">{componentName}</span>
                  )}
                </span>
              </div>

              {/* View Props Dropdown */}
              <ComponentPropsSection
                componentProps={componentProps}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <MessageIdCopyButton messageId={message.id} />
      </>
    );
  },
);

ComponentMessage.displayName = "ComponentMessage";
