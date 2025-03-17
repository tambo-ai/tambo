"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CLIProps {
  command?: string;
}

export function CLI({ command }: CLIProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (command) {
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 font-mono text-sm overflow-x-auto inline-block rounded-lg bg-[#1E1E1E]">
      {command && (
        <div className="flex items-start whitespace-nowrap">
          <span className="text-[#5C94F7] mr-2">$</span>
          <span className="text-white">{command}</span>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-primary transition-colors ml-2"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
