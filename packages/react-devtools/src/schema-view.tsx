"use client";
import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { jsonSchemaToTs } from "./schema-to-ts";

interface SchemaViewProps {
  schema: unknown;
  style: CSSProperties;
  schemaName?: "InputSchema" | "OutputSchema";
}

/**
 * Displays a JSON schema as syntax-highlighted TypeScript-like type notation.
 * Uses shiki for highlighting, falling back to plain text while loading.
 * @param props - Schema data and style
 * @returns Pre element with syntax-highlighted TypeScript representation
 */
export const SchemaView: React.FC<SchemaViewProps> = ({
  schema,
  style,
  schemaName = "InputSchema",
}) => {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const tsCode = schema ? jsonSchemaToTs(schema, schemaName) : null;

  useEffect(() => {
    if (!tsCode) {
      return;
    }

    let cancelled = false;

    const highlight = async () => {
      const { codeToHtml } = await import("shiki");
      const html = await codeToHtml(tsCode, {
        lang: "typescript",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        defaultColor: false,
      });

      if (!cancelled) {
        setHighlightedHtml(html);
      }
    };

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [tsCode]);

  if (!schema) {
    return null;
  }

  if (highlightedHtml) {
    return (
      <div
        className="tdt-schema-view"
        style={style}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  // Plain text fallback while shiki loads
  return (
    <pre className="tdt-schema-view" style={style}>
      {tsCode}
    </pre>
  );
};
