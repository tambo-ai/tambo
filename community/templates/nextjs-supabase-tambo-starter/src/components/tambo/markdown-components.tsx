"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import * as React from "react";

/* ───────────────── Utilities ───────────────── */

const looksLikeCode = (text: string): boolean => {
  const indicators = [
    /^import\s+/m,
    /^export\s+/m,
    /^function\s+/m,
    /^class\s+/m,
    /^[\s\S]*=>/m,
    /[{}[\]();]/,
  ];
  return indicators.some((p) => p.test(text));
};

/* ───────────────── Resource Mention ───────────────── */

function ResourceMention({ name, uri }: { name: string; uri: string }) {
  return (
    <span
      className="
        inline-flex items-center
        rounded-sm
        px-2 py-0.5
        text-[11px]
        tracking-widest uppercase
        border border-border
        bg-secondary
        text-foreground
      "
      title={uri}
      data-resource-uri={uri}
    >
      @{name}
    </span>
  );
}

/* ───────────────── Code Header ───────────────── */

const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState(false);
  const timeout = React.useRef<NodeJS.Timeout | null>(null);

  const copy = async () => {
    if (!code) return;
    if (timeout.current) clearTimeout(timeout.current);

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
    } catch {
      setError(true);
    }

    timeout.current = setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 2000);
  };

  const Icon = error ? (
    <X className="h-4 w-4 text-destructive" />
  ) : copied ? (
    <Check className="h-4 w-4 text-foreground" />
  ) : (
    <Copy className="h-4 w-4 text-muted-foreground" />
  );

  return (
    <div className="flex items-center justify-between border-b border-border bg-[#0c0e12] px-4 py-2">
      <span className="text-[11px] tracking-widest uppercase text-muted-foreground">
        {language ?? "CODE"}
      </span>

      <button
        onClick={copy}
        aria-label="Copy code"
        className="
          p-1
          border border-border
          bg-secondary
          hover:bg-muted
          transition-colors
        "
      >
        {Icon}
      </button>
    </div>
  );
};

/* ───────────────── Markdown Components ───────────────── */

export const createMarkdownComponents = (): Record<
  string,
  React.ComponentType<any>
> => ({
  /* ───── Code ───── */

  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const content = String(children).replace(/\n$/, "");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const deferred = React.useDeferredValue(content);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const highlighted = React.useMemo(() => {
      if (!match || !looksLikeCode(deferred)) return null;
      try {
        return hljs.highlight(deferred, { language: match[1] }).value;
      } catch {
        return deferred;
      }
    }, [deferred, match]);

    if (match && looksLikeCode(content)) {
      return (
        <div className="my-4 max-w-[90ch] border border-border bg-card overflow-hidden">
          <CodeHeader language={match[1]} code={content} />

          <pre className="p-4 text-sm overflow-x-auto">
            <code
              className={className}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(highlighted ?? content),
              }}
            />
          </pre>
        </div>
      );
    }

    /* Inline code */
    return (
      <code className="px-1.5 py-0.5 text-sm border border-border bg-secondary text-foreground">
        {children}
      </code>
    );
  },

  /* ───── Typography ───── */

  p: ({ children }) => (
    <p className="my-2 text-sm leading-relaxed text-foreground">
      {children}
    </p>
  ),

  h1: ({ children }) => (
    <h1 className="mt-6 mb-4 text-lg tracking-widest uppercase text-foreground">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mt-5 mb-3 text-base tracking-widest uppercase text-foreground">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-sm tracking-widest uppercase text-muted-foreground">
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="mt-3 mb-2 text-sm font-medium text-foreground">
      {children}
    </h4>
  ),

  /* ───── Lists ───── */

  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2 space-y-1 text-sm">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 text-sm">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="text-foreground">{children}</li>
  ),

  /* ───── Blockquote ───── */

  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-2 border-border text-sm text-muted-foreground">
      {children}
    </blockquote>
  ),

  /* ───── Links ───── */

  a: ({ href, children }) => {
    if (href?.startsWith("tambo-resource://")) {
      const encoded = href.slice("tambo-resource://".length);
      let uri = encoded;
      try {
        uri = decodeURIComponent(encoded);
      } catch {}

      const name =
        typeof children === "string" ? children : String(children ?? uri);

      return <ResourceMention name={name} uri={uri} />;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  },

  /* ───── Divider ───── */

  hr: () => (
    <hr className="my-4 border-border" />
  ),

  /* ───── Tables ───── */

  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border border-border text-sm">
        {children}
      </table>
    </div>
  ),

  th: ({ children }) => (
    <th className="border border-border bg-secondary px-4 py-2 text-xs tracking-widest uppercase text-muted-foreground text-left">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="border border-border px-4 py-2 text-foreground">
      {children}
    </td>
  ),
});

/* ───────────────── Export Singleton ───────────────── */

export const markdownComponents = createMarkdownComponents();
