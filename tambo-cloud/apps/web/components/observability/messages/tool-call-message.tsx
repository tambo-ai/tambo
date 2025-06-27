import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Settings,
  XCircle,
} from "lucide-react";
import { memo, useState } from "react";
import { formatTime } from "../utils";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ToolCallMessageProps {
  message: MessageType;
  toolResponse?: MessageType;
  isHighlighted?: boolean;
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

export const ToolCallMessage = memo(
  ({
    message,
    toolResponse,
    isHighlighted = false,
    copiedId,
    onCopyId,
  }: ToolCallMessageProps) => {
    const [showArguments, setShowArguments] = useState(false);
    const [showResponse, setShowResponse] = useState(false);

    const toolName = message.toolCallRequest?.toolName || "Unknown Tool";
    const parameters = message.toolCallRequest?.parameters || [];

    // Check for errors
    const hasToolCallError = message.error;
    const hasToolResponseError =
      toolResponse?.actionType === "tool_response" && toolResponse?.error;
    const hasAnyError = hasToolCallError || hasToolResponseError;

    const deepParseJson = (value: any): any => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          // If it's an object or array, recursively parse its contents
          if (typeof parsed === "object" && parsed !== null) {
            return deepParseJson(parsed);
          }
          return parsed;
        } catch {
          return value;
        }
      } else if (Array.isArray(value)) {
        return value.map(deepParseJson);
      } else if (typeof value === "object" && value !== null) {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          result[key] = deepParseJson(val);
        }
        return result;
      }
      return value;
    };

    const formatAllParameters = () => {
      if (parameters.length === 0) return "{}";

      const paramObj: Record<string, any> = {};
      parameters.forEach(
        (param: { parameterName: string; parameterValue: string }) => {
          try {
            // Try to parse the parameter value if it's a string
            if (typeof param.parameterValue === "string") {
              try {
                const parsed = JSON.parse(param.parameterValue);
                // Use deepParseJson to handle nested JSON strings
                paramObj[param.parameterName] = deepParseJson(parsed);
              } catch {
                paramObj[param.parameterName] = param.parameterValue;
              }
            } else {
              paramObj[param.parameterName] = param.parameterValue;
            }
          } catch {
            paramObj[param.parameterName] = param.parameterValue;
          }
        },
      );

      return JSON.stringify(paramObj, null, 2);
    };

    const formatResponseContent = (content: any) => {
      try {
        // Handle null or undefined content
        if (content == null) {
          return "null";
        }

        // If content is an array (like message.content format)
        if (Array.isArray(content)) {
          // Extract text from content parts (similar to extractToolResponse in backend)
          const textParts = content
            .filter((part) => part && part.type === "text" && part.text)
            .map((part) => part.text);

          if (textParts.length === 0) {
            return "No text content found";
          }

          const combinedText = textParts.join("");
          // Recursively process the combined text
          return formatResponseContent(combinedText);
        }

        // If content is a string
        if (typeof content === "string") {
          // Use the same logic as backend's tryParseJson
          if (!content.startsWith("{") && !content.startsWith("[")) {
            return content;
          }

          try {
            const parsed = JSON.parse(content);
            const deepParsed = deepParseJson(parsed);
            return JSON.stringify(deepParsed, null, 2);
          } catch {
            // handle escaped characters
            if (content.includes("\\n") || content.includes('\\"')) {
              try {
                const unescaped = content
                  .replace(/\\n/g, "\n")
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, "\\");

                const parsed = JSON.parse(unescaped);
                const deepParsed = deepParseJson(parsed);
                return JSON.stringify(deepParsed, null, 2);
              } catch {
                // Return unescaped version for better readability
                return content
                  .replace(/\\n/g, "\n")
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, "\\");
              }
            }

            // Return original content if parsing fails
            return content;
          }
        }

        // If it's already an object, use deepParseJson and stringify
        const deepParsed = deepParseJson(content);
        return JSON.stringify(deepParsed, null, 2);
      } catch (error) {
        console.error("Error formatting response content:", error);
        return String(content);
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
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
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
                  Tool Call: <span className="font-normal">{toolName}</span>
                </span>
              </div>

              {/* View Arguments Dropdown */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowArguments(!showArguments)}
                  className="w-full flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-xs sm:text-sm text-primary">
                    View Arguments
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyId(formatAllParameters());
                      }}
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors"
                    >
                      {copiedId === formatAllParameters() ? (
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                      ) : (
                        <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
                        showArguments && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: showArguments ? "auto" : 0,
                    opacity: showArguments ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 sm:p-4 bg-background">
                    <pre className="text-[10px] sm:text-xs font-mono text-primary overflow-auto">
                      <code>{formatAllParameters()}</code>
                    </pre>
                  </div>
                </motion.div>
              </div>

              {/* View Response Dropdown */}
              {toolResponse && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowResponse(!showResponse)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 sm:p-3 bg-muted/30 hover:bg-muted/50 transition-colors",
                      hasToolResponseError && "bg-red-50 border-red-200",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium text-xs sm:text-sm",
                          hasToolResponseError
                            ? "text-red-700"
                            : "text-primary",
                        )}
                      >
                        View Response
                      </span>
                      {hasToolResponseError && (
                        <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-700" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyId(formatResponseContent(toolResponse.content));
                        }}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors"
                      >
                        {copiedId ===
                        formatResponseContent(toolResponse.content) ? (
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                        ) : (
                          <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                        )}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
                          showResponse && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: showResponse ? "auto" : 0,
                      opacity: showResponse ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 sm:p-4 bg-background max-h-64 sm:max-h-96 overflow-auto">
                      {/* Single unified response content display */}
                      <pre className="text-[10px] sm:text-xs font-mono text-primary whitespace-pre-wrap break-words overflow-auto">
                        <code>
                          {formatResponseContent(toolResponse.content)}
                        </code>
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
          className="flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-foreground px-1"
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

ToolCallMessage.displayName = "ToolCallMessage";
