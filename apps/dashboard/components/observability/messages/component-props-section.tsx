import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { HighlightedJson } from "./highlight";

interface ComponentPropsSectionProps {
  componentProps: Record<string, unknown>;
  searchQuery?: string;
}

export function ComponentPropsSection({
  componentProps,
  searchQuery,
}: ComponentPropsSectionProps) {
  const [showProps, setShowProps] = useState(false);

  const formatPropsValue = (props: Record<string, unknown>) => {
    try {
      return JSON.stringify(props, null, 2);
    } catch {
      return String(props);
    }
  };

  const formattedProps = formatPropsValue(componentProps);
  const [copied, copy] = useClipboard(formattedProps);

  return (
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
            onClick={async (e) => {
              e.stopPropagation();
              await copy();
            }}
            className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors text-primary"
          >
            {copied ? (
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
            {searchQuery ? (
              <HighlightedJson
                json={formattedProps}
                searchQuery={searchQuery}
              />
            ) : (
              formattedProps
            )}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
