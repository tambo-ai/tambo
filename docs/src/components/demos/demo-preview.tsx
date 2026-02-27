"use client";

import { cva } from "class-variance-authority";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { type ReactNode, useId, useState } from "react";
import { DemoControlBar } from "./demo-controls";
import { DemoProvider, useDemoContext } from "./demo-provider";

const COLLAPSED_HEIGHT = "13rem";

interface CodeFile {
  code: string;
  language?: string;
  name?: string;
}

interface DemoPreviewProps {
  children: ReactNode;
  code: string | CodeFile | CodeFile[];
  language?: string;
}

function languageFromName(name: string): string | undefined {
  return name.split(".").pop() || undefined;
}

const handleCodeFileDefaults = (
  file: CodeFile,
  index: number,
  options: { defaultLanguage?: string; isArray?: boolean } = {},
): CodeFile => ({
  name: options.isArray
    ? (file.name ?? `File ${index + 1}`)
    : (file.name ?? "Code"),
  code: file.code,
  language:
    file.language ??
    languageFromName(file.name ?? "") ??
    options.defaultLanguage,
});

function normalizeCode(
  code: string | CodeFile | CodeFile[],
  defaultLanguage: string,
): CodeFile[] {
  if (typeof code === "string") {
    return [{ name: "Demo", code, language: defaultLanguage }];
  }
  if (Array.isArray(code)) {
    return code.map((file, index) =>
      handleCodeFileDefaults(file, index, { defaultLanguage, isArray: true }),
    );
  }
  return [handleCodeFileDefaults(code, 0, { defaultLanguage, isArray: false })];
}

/**
 * Renders a live demo area with a partially-visible, expandable code panel below
 * using Fumadocs' DynamicCodeBlock for proper syntax highlighting. When a child
 * demo component calls `useDemoControls`, a control bar renders automatically
 * above the demo area.
 *
 * Accepts a single code string, a single `{ name, code }` object, or an array
 * of `{ name, code }` objects for tabbed multi-file previews.
 *
 * @returns A demo preview with live content and expandable source code.
 */
export function DemoPreview({
  children,
  code,
  language = "tsx",
}: DemoPreviewProps) {
  return (
    <DemoProvider>
      <DemoPreviewInner code={code} language={language}>
        {children}
      </DemoPreviewInner>
    </DemoProvider>
  );
}

const codeTab = cva(
  "px-3 py-1.5 text-xs font-medium transition-colors border-b-2",
  {
    variants: {
      active: {
        true: "border-fd-primary text-fd-foreground",
        false:
          "border-transparent text-fd-muted-foreground hover:text-fd-accent-foreground",
      },
    },
  },
);

function DemoPreviewInner({
  children,
  code,
  language,
}: {
  children: ReactNode;
  code: string | CodeFile | CodeFile[];
  language: string;
}) {
  const { expanded, setExpanded } = useDemoContext();
  const codePanelId = useId();
  const files = normalizeCode(code, language);
  const [activeTab, setActiveTab] = useState(0);
  const activeFile = files[activeTab];
  const hasFiles = files.length > 0;

  return (
    <div
      className={`not-prose my-6 rounded-xl border border-fd-border ${
        expanded ? "" : "overflow-hidden"
      }`}
    >
      {/* Control bar — renders when a child calls useDemoControls */}
      <DemoControlBar />

      {/* Live demo area */}
      <div className="bg-fd-background p-6">{children}</div>

      {/* Code panel — partially visible when collapsed */}
      <div id={codePanelId} className="relative border-t border-fd-border">
        {/* File tabs — only shown for multi-file previews */}
        {hasFiles && (
          <div
            role="tablist"
            className="flex border-b border-fd-border bg-fd-muted/50"
          >
            {files.map((file, index) => (
              <button
                key={file.name}
                type="button"
                role="tab"
                aria-selected={index === activeTab}
                onClick={() => setActiveTab(index)}
                className={codeTab({ active: index === activeTab })}
              >
                {file.name}
              </button>
            ))}
          </div>
        )}

        <div
          style={{ maxHeight: expanded ? "none" : COLLAPSED_HEIGHT }}
          className="overflow-hidden [&_figure]:my-0 [&_figure]:rounded-none [&_figure]:border-0 [&_figure]:shadow-none"
        >
          <DynamicCodeBlock
            lang={activeFile.language ?? language}
            code={activeFile.code}
          />
        </div>

        {/* Gradient fade overlay when collapsed */}
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fd-card to-transparent" />
        )}
      </div>

      {/* Toggle button — sticky at viewport bottom when expanded */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={codePanelId}
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex w-full items-center justify-center border-t border-fd-border bg-fd-card py-2 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground ${
          expanded ? "sticky bottom-0 z-10" : ""
        }`}
      >
        {expanded ? "Hide code" : "Show more"}
      </button>
    </div>
  );
}
