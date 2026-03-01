"use client";

import { DemoPreview } from "@/components/demos/demo-preview";
import { McpResources } from "@tambo-ai/react-ui-base/mcp-resources";
import { FileText, Search } from "lucide-react";

export const mcpResourcesDemoCode = `
import { McpResources } from "@tambo-ai/react-ui-base/mcp-resources";
import { FileText, Search } from "lucide-react";

export function DemoMcpResources() {
  return (
    <McpResources.Root onSelectResource={(uri, label) => console.log("Selected:", uri, label)}>
      <div className="flex flex-col gap-3">
        <McpResources.Trigger className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          <FileText className="h-3.5 w-3.5" />
          Insert Resource
        </McpResources.Trigger>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <McpResources.Search
            placeholder="Search resources..."
            className="w-full rounded-lg border border-neutral-200 bg-transparent py-1.5 pl-8 pr-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:focus:ring-neutral-600"
          />
        </div>
        <McpResources.List
          render={(props, state) => (
            <div {...props} className="flex flex-col gap-1">
              {state.resources.map((entry) => (
                <McpResources.Item
                  key={entry.resource.uri}
                  uri={entry.resource.uri}
                  name={entry.resource.name}
                  description={entry.resource.description}
                  className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  {entry.resource.name ?? entry.resource.uri}
                </McpResources.Item>
              ))}
            </div>
          )}
        />
      </div>
    </McpResources.Root>
  );
}`.trimStart();

export function McpResourcesDemoPreview() {
  return (
    <DemoPreview code={mcpResourcesDemoCode}>
      <McpResourcesDemo />
    </DemoPreview>
  );
}

function McpResourcesDemo() {
  return (
    <McpResources.Root
      onSelectResource={(uri, label) => console.log("Selected:", uri, label)}
    >
      <div className="flex flex-col gap-3">
        <McpResources.Trigger className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          <FileText className="h-3.5 w-3.5" />
          Insert Resource
        </McpResources.Trigger>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <McpResources.Search
            placeholder="Search resources..."
            className="w-full rounded-lg border border-neutral-200 bg-transparent py-1.5 pl-8 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
          />
        </div>
        <McpResources.List
          render={(props, state) => (
            <div {...props} className="flex flex-col gap-1">
              {state.resources.map((entry) => (
                <McpResources.Item
                  key={entry.resource.uri}
                  uri={entry.resource.uri}
                  name={entry.resource.name}
                  description={entry.resource.description}
                  className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  {entry.resource.name ?? entry.resource.uri}
                </McpResources.Item>
              ))}
            </div>
          )}
        />
      </div>
    </McpResources.Root>
  );
}
