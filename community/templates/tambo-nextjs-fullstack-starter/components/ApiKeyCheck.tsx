"use client";

import { useEffect, useState } from "react";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_TAMBO_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "AUTH_URL",
];

const EnvMissingAlert = ({ missing }: { missing: string[] }) => (
  <div className="mb-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
    <p className="mb-3">The following environment variable(s) are missing:</p>
    <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
      {missing.map((key) => (
        <li key={key}>
          <code className="bg-yellow-100 px-2 py-0.5 rounded">{key}</code>
        </li>
      ))}
    </ul>
    <p className="text-sm">
      Read{" "}
      <a
        target="_blank"
        rel="noopener noreferrer"
        className=" hover:text-yellow-900"
      >
        README.md
      </a>{" "}
      for setup details.
    </p>
  </div>
);

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/env-check")
      .then((r) => r.json())
      .then((data: { missing: string[] }) => setMissing(data.missing))
      .catch(() => setMissing([]));
  }, []);

  const hasRequiredMissing =
    missing !== null && missing.some((k) => REQUIRED_KEYS.includes(k));
  const allConfigured = missing !== null && missing.length === 0;

  return (
    <div className="flex items-start gap-4">
      <div className="grow">
        <div className="flex items-center gap-1 text-foreground">
          <div className="min-w-6">
            {missing === null ? "⏳" : allConfigured ? "✅" : "❌"}
          </div>
          <p>
            {missing === null
              ? "Checking environment..."
              : allConfigured
                ? "All set to go!"
                : "Environment incomplete"}
          </p>
        </div>
        {missing !== null && missing.length > 0 && (
          <EnvMissingAlert missing={missing} />
        )}

        {missing !== null && !hasRequiredMissing && children}
      </div>
    </div>
  );
}
