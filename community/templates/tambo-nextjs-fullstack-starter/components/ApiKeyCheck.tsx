"use client";

import { useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const ApiKeyMissingAlert = () => (
  <div className="mb-4 p-6 bg-muted border border-border rounded-lg text-foreground">
    <p className="mb-3">To get started, you need to initialize Tambo:</p>
    <div className="flex items-center gap-2 bg-background border border-border p-3 rounded mb-3">
      <code className="text-sm grow font-mono">npx tambo init</code>
      <CopyButton text="npx tambo init" />
    </div>
    <p className="text-sm text-muted-foreground">
      Or visit{" "}
      <a
        href="https://tambo.co/cli-auth"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-primary hover:text-primary/90"
      >
        tambo.co/cli-auth
      </a>{" "}
      to get your API key and set it in{" "}
      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
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
      className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded transition-colors relative group"
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
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {showCopied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
};

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <div className="flex items-start gap-4">
      <div className="grow">
        <div className="flex items-center gap-1 text-foreground">
          <div className="min-w-6">{isApiKeyMissing ? "❌" : "✅"}</div>
          <p>
            {isApiKeyMissing ? "Tambo not initialized" : "Tambo initialized"}
          </p>
        </div>
        {isApiKeyMissing && <ApiKeyMissingAlert />}

        {!isApiKeyMissing && children}
      </div>
    </div>
  );
}
