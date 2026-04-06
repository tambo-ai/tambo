import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { HighlightedJson } from "./highlight";

interface ToolResponseSectionProps {
  toolResponse: {
    role: string;
    content: unknown;
    error?: string | null;
  };
  formatToolResponseContent: (content: unknown) => string;
  searchQuery?: string;
}

export function ToolResponseSection({
  toolResponse,
  formatToolResponseContent,
  searchQuery,
}: ToolResponseSectionProps) {
  const [showResponse, setShowResponse] = useState(false);
  const formattedResponse = formatToolResponseContent(toolResponse.content);
  const [copied, copy] = useClipboard(formattedResponse);
  const hasToolResponseError = Boolean(
    toolResponse?.role === "tool" && toolResponse?.error,
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className={cn(
          "flex items-center bg-muted/30 hover:bg-muted/50 transition-colors",
          hasToolResponseError && "bg-red-50 border-red-200",
        )}
      >
        <button
          type="button"
          onClick={() => setShowResponse(!showResponse)}
          className="flex-1 flex items-center justify-between p-2 sm:p-3"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-xs sm:text-sm",
                hasToolResponseError ? "text-red-700" : "text-primary",
              )}
            >
              View Response
            </span>
            {hasToolResponseError && (
              <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-700" />
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
              showResponse && "rotate-180",
            )}
          />
        </button>
        <button
          type="button"
          aria-label="Copy tool response"
          onClick={async () => {
            await copy();
          }}
          className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center hover:bg-muted rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mr-2 sm:mr-3"
        >
          {copied ? (
            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
          ) : (
            <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
          )}
        </button>
      </div>

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
          <pre className="text-[10px] sm:text-xs font-mono text-primary whitespace-pre-wrap break-words overflow-auto">
            {searchQuery ? (
              <HighlightedJson
                json={formattedResponse}
                searchQuery={searchQuery}
              />
            ) : (
              formattedResponse
            )}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
