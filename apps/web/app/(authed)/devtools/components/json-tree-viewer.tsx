"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface JsonTreeViewerProps {
  data: unknown;
  label?: string;
  defaultExpanded?: boolean;
}

/**
 * Renders any JSON-compatible value as a collapsible tree.
 *
 * @returns A recursive tree view with expand/collapse for objects and arrays.
 */
export function JsonTreeViewer({
  data,
  label,
  defaultExpanded = false,
}: JsonTreeViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  if (data === null || data === undefined) {
    return (
      <span className="font-mono text-sm text-gray-400">
        {label && <span className="text-foreground">{label}: </span>}
        {String(data)}
      </span>
    );
  }

  if (typeof data === "string") {
    return (
      <span className="font-mono text-sm">
        {label && <span className="text-foreground">{label}: </span>}
        <span className="text-green-600">&quot;{data}&quot;</span>
      </span>
    );
  }

  if (typeof data === "number") {
    return (
      <span className="font-mono text-sm">
        {label && <span className="text-foreground">{label}: </span>}
        <span className="text-blue-600">{data}</span>
      </span>
    );
  }

  if (typeof data === "boolean") {
    return (
      <span className="font-mono text-sm">
        {label && <span className="text-foreground">{label}: </span>}
        <span className="text-orange-600">{String(data)}</span>
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data as Record<string, unknown>);
  const summary = isArray
    ? `${entries.length} items`
    : `${entries.length} keys`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 font-mono text-sm hover:underline">
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        {label && <span>{label}</span>}
        <span className="text-muted-foreground">({summary})</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4">
        {entries.map(([key, value]) => (
          <div key={key} className="py-0.5">
            <JsonTreeViewer data={value} label={key} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
