"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CLIProps {
  command?: string;
  className?: string;
  title?: string;
}

export function CLI({ command, className, title }: CLIProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (command) {
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg bg-[#1E1E1E] text-white overflow-hidden shadow-md",
        className,
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-[#444]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>
        {title && <div className="text-xs text-gray-400">{title}</div>}
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-primary transition-colors"
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
        {command && (
          <div className="flex items-start">
            <span className="text-[#5C94F7] mr-2">$</span>
            <span className="text-white">{command}</span>
          </div>
        )}
      </div>
    </div>
  );
}
