"use client";

import { Check, Copy } from "lucide-react";
import { ReactNode, useState } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function CopyablePrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg bg-accent/10 p-5 border border-border/40">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Try this prompt in the chat interface
        </h3>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="px-2 py-1 text-xs bg-background/80 rounded hover:bg-accent/20 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="text-sm bg-card p-3 rounded-md overflow-x-auto border border-border/40 whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
}
