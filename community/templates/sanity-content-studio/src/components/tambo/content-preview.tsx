"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, Eye, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ContentPreviewProps {
  title: string;
  excerpt: string;
  body: string;
  status?: "draft" | "published";
}

export function ContentPreview({
  title,
  excerpt,
  body,
  status = "draft",
}: ContentPreviewProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-[hsl(var(--card))] shadow-sm">
      {/* Header */}
      <div className="border-b bg-[hsl(var(--muted))] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Content Preview
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              status === "published"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {status === "published" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {status === "published" ? "Published" : "Draft"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-[hsl(var(--primary))] p-2">
            <FileText className="h-5 w-5 text-[hsl(var(--primary-foreground))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[hsl(var(--foreground))]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {excerpt}
            </p>
          </div>
        </div>

        <hr className="my-6 border-[hsl(var(--border))]" />

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 text-xl font-bold text-[hsl(var(--foreground))]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-6 text-lg font-semibold text-[hsl(var(--foreground))]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-base font-semibold text-[hsl(var(--foreground))]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-[hsl(var(--foreground))]">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 list-disc pl-6 text-[hsl(var(--foreground))]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 list-decimal pl-6 text-[hsl(var(--foreground))]">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ children }) => (
                <code className="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-sm">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-[hsl(var(--muted))] p-4">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-4 border-l-4 border-[hsl(var(--primary))] pl-4 italic text-[hsl(var(--muted-foreground))]">
                  {children}
                </blockquote>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
