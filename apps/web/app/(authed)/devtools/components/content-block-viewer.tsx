"use client";

import { Badge } from "@/components/ui/badge";
import type { SerializedContent } from "@/devtools-server/types";

import { JsonTreeViewer } from "./json-tree-viewer";

interface ContentBlockViewerProps {
  block: SerializedContent;
}

/**
 * Renders a single content block based on its type.
 *
 * @returns A styled view of the content block with appropriate formatting per type.
 */
export function ContentBlockViewer({ block }: ContentBlockViewerProps) {
  switch (block.type) {
    case "text":
      return <pre className="whitespace-pre-wrap text-sm">{block.text}</pre>;

    case "tool_use":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge>Tool Call</Badge>
            <span className="font-mono text-sm">{block.name}</span>
          </div>
          <JsonTreeViewer data={block.input} label="input" />
        </div>
      );

    case "tool_result":
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={block.isError ? "destructive" : "default"}>
            {block.isError ? "Tool Error" : "Tool Result"}
          </Badge>
          <JsonTreeViewer data={block.content} label="result" />
        </div>
      );

    case "component":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Component</Badge>
            <span className="font-mono text-sm">{block.name}</span>
          </div>
          <JsonTreeViewer data={block.props} label="props" />
        </div>
      );

    case "resource":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Resource</Badge>
            <span className="font-mono text-sm">{block.uri}</span>
          </div>
          <JsonTreeViewer data={block.content} label="content" />
        </div>
      );

    default:
      return <JsonTreeViewer data={block} label="unknown" />;
  }
}
