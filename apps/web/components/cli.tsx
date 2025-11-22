"use client";

import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CLIItem {
  id: string;
  label: string;
  command: string;
}

interface CLIProps {
  items: CLIItem[];
  className?: string;
  title?: string;
  theme?: "dark" | "light";
  defaultActiveItemId?: string;
  onItemChange?: (itemId: string) => void;
}

export function CLI({
  items,
  className,
  title,
  theme = "dark",
  defaultActiveItemId,
  onItemChange,
}: CLIProps) {
  const [activeItemId, setActiveItemId] = useState<string>(
    defaultActiveItemId || (items.length > 0 ? items[0].id : ""),
  );

  const activeItem = items.find((item) => item.id === activeItemId) || items[0];
  const [copied, copy] = useClipboard(activeItem?.command ?? "");

  // Guard against empty items array
  if (items.length === 0) {
    return null;
  }

  const handleItemChange = (itemId: string) => {
    setActiveItemId(itemId);
    if (onItemChange) {
      onItemChange(itemId);
    }
  };

  const hasTabs = items.length > 1;
  const isLightMode = theme === "light";

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden shadow-md",
        isLightMode ? "bg-white text-slate-900" : "bg-[#1E1E1E] text-white",
        className,
      )}
    >
      {/* Terminal Header */}
      <div
        className={cn(
          "flex items-center px-4 py-2 border-b",
          isLightMode
            ? "bg-slate-200 border-slate-300"
            : "bg-[#2D2D2D] border-[#444]",
        )}
      >
        {/* Window Controls */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>

        {/* Title or Tabs */}
        <div className={cn("flex-1", hasTabs ? "ml-6" : "ml-4")}>
          {hasTabs ? (
            <div className="flex items-center">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemChange(item.id)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium transition-colors border-x border-t rounded-t-lg -mb-px",
                    activeItemId === item.id
                      ? isLightMode
                        ? "bg-white text-gray-900 border-gray-200"
                        : "bg-[#1E1E1E] text-white border-[#444]"
                      : isLightMode
                        ? "text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200/50"
                        : "text-gray-400 hover:text-gray-300 border-transparent hover:border-[#444]/50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            title && (
              <div
                className={cn(
                  "text-xs text-center w-full",
                  isLightMode ? "text-slate-500" : "text-gray-400",
                )}
              >
                {title}
              </div>
            )
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={copy}
          className={cn(
            "transition-colors ml-2",
            isLightMode
              ? "text-slate-500 hover:text-primary"
              : "text-gray-400 hover:text-primary",
          )}
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm overflow-x-auto">
        <div className="flex items-start">
          <span
            className={cn(
              "mr-2",
              isLightMode ? "text-sky-600" : "text-[#5C94F7]",
            )}
          >
            $
          </span>
          <span className={isLightMode ? "text-slate-800" : "text-white"}>
            {activeItem.command}
          </span>
        </div>
      </div>
    </div>
  );
}
