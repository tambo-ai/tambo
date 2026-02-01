"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const ApiKeyMissingAlert = () => (
  <div className="mb-4 rounded-lg border border-destructive bg-destructive/5 p-4">
    <p className="mb-2 text-sm font-medium text-destructive">
      Tambo is not initialized
    </p>

    <p className="mb-3 text-sm text-muted-foreground">
      Run the following command to authenticate:
    </p>

    <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
      <code className="flex-1 text-sm font-mono">
        npx tambo init
      </code>
      <CopyButton text="npx tambo init" />
    </div>

    <p className="mt-3 text-xs text-muted-foreground">
      Or visit{" "}
      <a
        href="https://tambo.co/cli-auth"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        tambo.co/cli-auth
      </a>{" "}
      and set the API key in{" "}
      <code className="rounded bg-muted px-1.5 py-0.5">
        .env.local
      </code>
    </p>
  </div>
);


const CopyButton = ({ text }: { text: string }) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="rounded-md border bg-background px-2 py-1 text-xs"
      title="Copy to clipboard"
    >
      {showCopied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}

      <span
        className="
          absolute -top-8 left-1/2 -translate-x-1/2
          bg-black/80 backdrop-blur-md
          border border-cyan-400/20
          text-cyan-200
          px-2 py-1 rounded text-xs
          opacity-0 group-hover:opacity-100
          shadow-[0_0_15px_rgba(0,246,255,0.4)]
          transition-opacity
        "
      >
        {showCopied ? "Copied" : "Copy"}
      </span>
    </button>
  );
};

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing =
    !process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isApiKeyMissing
              ? "bg-destructive"
              : "bg-emerald-500",
          )}
        />
        <span>
          {isApiKeyMissing
            ? "Tambo not initialized"
            : "Tambo initialized"}
        </span>
      </div>

      {isApiKeyMissing && <ApiKeyMissingAlert />}
      {!isApiKeyMissing && children}
    </div>
  );
}

