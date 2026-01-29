"use client";

import { useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const ApiKeyMissingAlert = () => (
  <div className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
    <p className="mb-3">To get started, you need to set your Tambo API key:</p>
    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded mb-3">
      <code className="text-sm grow">PUBLIC_TAMBO_API_KEY=your-api-key</code>
      <CopyButton text="PUBLIC_TAMBO_API_KEY=your-api-key" />
    </div>
    <p className="text-sm">
      Visit{" "}
      <a
        href="https://tambo.co/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-yellow-900"
      >
        tambo.co/dashboard
      </a>{" "}
      to get your API key and set it in{" "}
      <code className="bg-yellow-100 px-2 py-1 rounded">.env</code>
    </p>
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    // eslint-disable-next-line no-undef
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    // eslint-disable-next-line no-undef
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded transition-colors relative group"
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
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        {showCopied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
};

function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing = !import.meta.env.PUBLIC_TAMBO_API_KEY;

  return (
    <div className="flex items-start gap-4">
      <div className="grow">
        <div className="flex items-center gap-1">
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

export default ApiKeyCheck;
