import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy, Monitor } from "lucide-react";
import { memo, useState } from "react";
import { formatTime } from "../utils";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ComponentMessageProps {
  message: MessageType;
  isHighlighted?: boolean;
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

export const ComponentMessage = memo(
  ({
    message,
    isHighlighted = false,
    copiedId,
    onCopyId,
  }: ComponentMessageProps) => {
    const [showProps, setShowProps] = useState(false);

    const componentName =
      message.componentDecision?.componentName || "Unknown Component";
    const componentProps = message.componentDecision?.props || {};

    const formatPropsValue = (props: any) => {
      try {
        return JSON.stringify(props, null, 2);
      } catch {
        return String(props);
      }
    };

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
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
            )}
          >
            <div className="flex flex-col gap-2 sm:gap-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  UI Component:{" "}
                  <span className="font-normal">{componentName}</span>
                </span>
              </div>

              {/* View Props Dropdown */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowProps(!showProps)}
                  className="w-full flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-primary"
                >
                  <span className="font-medium text-xs sm:text-sm text-primary">
                    View Props
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyId(formatPropsValue(componentProps));
                      }}
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors text-primary"
                    >
                      {copiedId === formatPropsValue(componentProps) ? (
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                      ) : (
                        <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200",
                        showProps && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: showProps ? "auto" : 0,
                    opacity: showProps ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-background">
                    <pre className="text-xs font-mono text-primary overflow-auto max-h-96">
                      <code>{formatPropsValue(componentProps)}</code>
                    </pre>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <motion.div
          className="flex items-center gap-2 mt-2 text-[11px] text-foreground px-1"
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

ComponentMessage.displayName = "ComponentMessage";
