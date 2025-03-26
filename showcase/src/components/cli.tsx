"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CLIProps {
  command?: string;
  background?: string;
  path?: string;
  isCode?: boolean;
  language?: string;
}

export function CLI({
  command,
  background = "#1E1E1E",
  path,
  isCode = false,
  language = "typescript",
}: CLIProps) {
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
      className="p-4 font-mono text-sm overflow-x-auto inline-block rounded-lg w-full"
      style={{ background }}
    >
      {command && (
        <div className="flex items-start">
          <div className="flex-1">
            {path && (
              <div className="flex items-center mb-2">
                <span className="text-[#A0A0A0] text-xs">{path}</span>
              </div>
            )}
            {isCode ? (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  background: "transparent",
                  padding: 0,
                }}
              >
                {command.trim()}
              </SyntaxHighlighter>
            ) : (
              <div className="flex items-start">
                <span className="text-[#5C94F7] mr-2 flex-shrink-0">$</span>
                <pre className="text-white whitespace-pre-wrap break-all">
                  {command}
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-primary transition-colors ml-2 flex-shrink-0"
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
