"use client";

import { useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

function ApiKeyMissingAlert() {
  return (
    <p className="text-sm text-muted-foreground">
      To get started, you need to initialize Tambo:{" "}
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        npx tambo init
      </code>{" "}
      Or visit{" "}
      <a
        href="https://tambo.co/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:no-underline"
      >
        tambo.co/dashboard
      </a>{" "}
      to get your API key and set it in <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code>
    </p>
  );
}

function CopyButton({ text }: { text: string }) {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
    >
      {showCopied ? "Copied!" : "Copy"}
    </button>
  );
}

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
        <span className="text-lg">{isApiKeyMissing ? "❌" : "✅"}</span>
        <span className="font-medium">
          {isApiKeyMissing ? "Tambo not initialized" : "Tambo initialized"}
        </span>
      </div>
      {isApiKeyMissing && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <ApiKeyMissingAlert />
          <div className="mt-2">
            <CopyButton text="npx tambo init" />
          </div>
        </div>
      )}
      {!isApiKeyMissing && children}
    </div>
  );
}
