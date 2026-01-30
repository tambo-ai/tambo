"use client";

import { AlertCircle, Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface EnvErrorProps {
  missingVars: string[];
}

const ENV_VAR_DETAILS: Record<
  string,
  { label: string; help: string; link?: string }
> = {
  NEXT_PUBLIC_TAMBO_API_KEY: {
    label: "Tambo API Key",
    help: "Get your API key from the Tambo dashboard",
    link: "https://app.tambo.co/dashboard",
  },
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: {
    label: "Appwrite Project ID",
    help: "Find in Appwrite Console → Settings",
    link: "https://cloud.appwrite.io",
  },
  NEXT_PUBLIC_APPWRITE_ENDPOINT: {
    label: "Appwrite Endpoint",
    help: "Find in Appwrite Console → Settings → API Endpoint",
    link: "https://cloud.appwrite.io",
  },
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: {
    label: "Appwrite Database ID",
    help: "Find in Appwrite Console → Databases",
    link: "https://cloud.appwrite.io",
  },
  NEXT_PUBLIC_APPWRITE_COLLECTION_ID: {
    label: "Appwrite Collection ID",
    help: "Find in Appwrite Console → Databases → Your Collection",
    link: "https://cloud.appwrite.io",
  },
};

export function EnvError({ missingVars }: EnvErrorProps) {
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const copyToClipboard = async (text: string, varName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const envTemplate = missingVars.map((v) => `${v}=`).join("\n");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-destructive/5 to-background">
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-destructive/20 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-destructive/10 px-6 py-4 border-b border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Environment Setup Required
                </h1>
                <p className="text-sm text-muted-foreground">
                  {missingVars.length} missing variable
                  {missingVars.length > 1 ? "s" : ""} in your .env.local file
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Missing Variables */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">
                Missing Variables
              </h2>
              <div className="space-y-2">
                {missingVars.map((varName) => {
                  const details = ENV_VAR_DETAILS[varName];
                  return (
                    <div
                      key={varName}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono text-destructive">
                          {varName}
                        </code>
                        {details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {details.help}
                          </p>
                        )}
                      </div>
                      {details?.link && (
                        <a
                          href={details.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                        >
                          Get it
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">
                  Add to .env.local
                </h2>
                <button
                  onClick={() => copyToClipboard(envTemplate, "template")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedVar === "template" ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy all
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto">
                <code className="text-sm font-mono text-foreground">
                  {envTemplate}
                </code>
              </pre>
            </div>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Create a{" "}
                  <code className="px-1 py-0.5 rounded bg-muted">
                    .env.local
                  </code>{" "}
                  file in the project root
                </li>
                <li>Copy the template above and fill in your values</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
