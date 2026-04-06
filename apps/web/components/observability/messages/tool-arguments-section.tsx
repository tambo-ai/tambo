import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { HighlightedJson } from "./highlight";

interface ToolArgumentsSectionProps {
  parameters: Array<{ parameterName: string; parameterValue: string }>;
  formatToolParameters: (
    params: Array<{ parameterName: string; parameterValue: string }>,
  ) => string;
  searchQuery?: string;
}

export function ToolArgumentsSection({
  parameters,
  formatToolParameters,
  searchQuery,
}: ToolArgumentsSectionProps) {
  const [showArguments, setShowArguments] = useState(false);
  const formattedParams = formatToolParameters(parameters);
  const [copied, copy] = useClipboard(formattedParams);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center bg-muted/30 hover:bg-muted/50 transition-colors">
        <button
          type="button"
          onClick={() => setShowArguments(!showArguments)}
          className="flex-1 flex items-center justify-between p-2 sm:p-3"
        >
          <span className="font-medium text-xs sm:text-sm text-primary">
            View Arguments
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 text-primary",
              showArguments && "rotate-180",
            )}
          />
        </button>
        <button
          type="button"
          aria-label="Copy tool arguments"
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
          height: showArguments ? "auto" : 0,
          opacity: showArguments ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-2 sm:p-4 bg-background">
          <pre className="text-[10px] sm:text-xs font-mono text-primary overflow-auto">
            {searchQuery ? (
              <HighlightedJson
                json={formattedParams}
                searchQuery={searchQuery}
              />
            ) : (
              formattedParams
            )}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
