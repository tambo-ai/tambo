"use client";

import hljs from "highlight.js";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CLIProps {
  command?: string;
  path?: string;
  isCode?: boolean;
  language?: string;
}

export function CLI({
  command,
  path,
  isCode = false,
  language = "typescript",
}: CLIProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isCode && codeRef.current && command) {
      // Clear previous highlighting
      codeRef.current.removeAttribute("data-highlighted");
      codeRef.current.className = `language-${language}`;
      codeRef.current.textContent = command.trim();

      // Apply highlighting
      hljs.highlightElement(codeRef.current);
    }
  }, [command, isCode, language]);

  const copyToClipboard = async () => {
    if (command) {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3 md:p-4 font-mono text-xs md:text-sm rounded-lg w-full overflow-hidden bg-card border border-border">
      {command && (
        <div className="flex items-start">
          <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
            {path && (
              <div className="flex items-center mb-2">
                <span className="text-muted-foreground text-xs truncate">
                  {path}
                </span>
              </div>
            )}
            {isCode ? (
              <div className="overflow-x-auto">
                <pre
                  className="!bg-transparent !p-0 !m-0"
                  style={{ fontSize: "inherit" }}
                >
                  <code
                    ref={codeRef}
                    className={`language-${language} text-foreground cli-code`}
                  >
                    {command.trim()}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="flex items-start overflow-x-auto">
                <span className="text-muted-foreground mr-2 flex-shrink-0">
                  $
                </span>
                <pre className="text-foreground whitespace-pre-wrap break-words">
                  {command}
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0 p-1 touch-manipulation rounded-md"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
