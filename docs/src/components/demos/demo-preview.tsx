"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { type ReactNode, useState } from "react";

const COLLAPSED_HEIGHT = "13rem";

interface DemoPreviewProps {
  children: ReactNode;
  code: string;
  language?: string;
}

/**
 * Renders a live demo area with a partially-visible, expandable code panel below
 * using Fumadocs' DynamicCodeBlock for proper syntax highlighting.
 *
 * @returns A demo preview with live content and expandable source code.
 */
export function DemoPreview({
  children,
  code,
  language = "tsx",
}: DemoPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`not-prose my-6 rounded-xl border border-fd-border ${
        isExpanded ? "" : "overflow-hidden"
      }`}
    >
      {/* Live demo area */}
      <div className="bg-fd-background p-6">{children}</div>

      {/* Code panel — partially visible when collapsed */}
      <div className="relative border-t border-fd-border">
        <div
          style={{ maxHeight: isExpanded ? "none" : COLLAPSED_HEIGHT }}
          className="overflow-hidden [&_figure]:my-0 [&_figure]:rounded-none [&_figure]:border-0 [&_figure]:shadow-none"
        >
          <DynamicCodeBlock lang={language} code={code} />
        </div>

        {/* Gradient fade overlay when collapsed */}
        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fd-card to-transparent" />
        )}
      </div>

      {/* Toggle button — sticky at viewport bottom when expanded */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`flex w-full items-center justify-center border-t border-fd-border bg-fd-card py-2 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground ${
          isExpanded ? "sticky bottom-0 z-10" : ""
        }`}
      >
        {isExpanded ? "Hide code" : "Show more"}
      </button>
    </div>
  );
}
