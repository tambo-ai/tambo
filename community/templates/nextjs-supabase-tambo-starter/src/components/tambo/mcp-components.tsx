"use client";

import {
  Tooltip,
  TooltipProvider,
} from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
} from "@tambo-ai/react/mcp";
import { AlertCircle, AtSign, FileText, Search } from "lucide-react";
import * as React from "react";

/* ───────────────── Helpers (UNCHANGED LOGIC) ───────────────── */

interface PromptMessageContent {
  type?: string;
  text?: string;
}
interface PromptMessage {
  content?: PromptMessageContent;
}

function isValidPromptData(
  promptData: unknown,
): promptData is { messages: PromptMessage[] } {
  if (!promptData || typeof promptData !== "object") return false;
  const data = promptData as { messages?: unknown };
  return Array.isArray(data.messages);
}

function extractPromptText(messages: PromptMessage[]): string {
  return messages
    .map((m) =>
      m?.content?.type === "text" && typeof m.content.text === "string"
        ? m.content.text
        : "",
    )
    .filter(Boolean)
    .join("\n");
}

/* ───────────────── MCP PROMPT BUTTON ───────────────── */

export interface McpPromptButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onInsertText: (text: string) => void;
  value: string;
  className?: string;
}

export const McpPromptButton = React.forwardRef<
  HTMLButtonElement,
  McpPromptButtonProps
>(({ className, onInsertText, value, ...props }, ref) => {
  const { data: promptList, isLoading } = useTamboMcpPromptList();
  const [selectedPromptName, setSelectedPromptName] =
    React.useState<string | null>(null);
  const [promptError, setPromptError] =
    React.useState<string | null>(null);

  const { data: promptData, error: fetchError } =
    useTamboMcpPrompt(selectedPromptName ?? "");

  React.useEffect(() => {
    if (selectedPromptName && promptData) {
      if (!isValidPromptData(promptData)) {
        setPromptError("Invalid prompt format");
        setSelectedPromptName(null);
        return;
      }

      const promptText = extractPromptText(promptData.messages);
      if (!promptText) {
        setPromptError("Prompt is empty");
        setSelectedPromptName(null);
        return;
      }

      setPromptError(null);
      onInsertText(value ? `${value}\n\n${promptText}` : promptText);
      setSelectedPromptName(null);
    }
  }, [promptData, selectedPromptName, onInsertText, value]);

  React.useEffect(() => {
    if (fetchError) {
      setPromptError("Failed to load prompt");
      setSelectedPromptName(null);
    }
  }, [fetchError]);

  React.useEffect(() => {
    if (promptError) {
      const t = setTimeout(() => setPromptError(null), 2500);
      return () => clearTimeout(t);
    }
  }, [promptError]);

  if (!promptList || promptList.length === 0) return null;

  const buttonClasses = cn(
    `
      flex h-9 w-9 items-center justify-center
      rounded-md
      border
      bg-background
      text-foreground
      transition-colors
      hover:bg-muted
      focus-visible:outline-none
      focus-visible:ring-1 focus-visible:ring-ring
    `,
    promptError && "border-destructive text-destructive",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip content={promptError ?? "Insert MCP prompt"} side="top">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={buttonClasses}
              aria-label="Insert MCP Prompt"
              {...props}
            >
              {promptError ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={6}
              className="
                z-50 min-w-[240px]
                rounded-md
                border
                bg-popover
                p-1
                shadow-md
              "
            >
              <PromptListContent
                isLoading={isLoading}
                promptList={promptList}
                onSelectPrompt={setSelectedPromptName}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Tooltip>
    </TooltipProvider>
  );
});
McpPromptButton.displayName = "McpPromptButton";

/* ───────────────── PROMPT LIST ───────────────── */

function PromptListContent({
  isLoading,
  promptList,
  onSelectPrompt,
}: {
  isLoading: boolean;
  promptList:
    | {
        server: { url: string };
        prompt: { name: string; description?: string };
      }[]
    | undefined;
  onSelectPrompt: (name: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        Loading prompts…
      </div>
    );
  }

  if (!promptList || promptList.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        No prompts available
      </div>
    );
  }

  return (
    <>
      {promptList.map((entry) => (
        <DropdownMenu.Item
          key={`${entry.server.url}-${entry.prompt.name}`}
          onSelect={() => onSelectPrompt(entry.prompt.name)}
          className="
            cursor-pointer rounded-md px-3 py-2
            text-sm
            text-foreground
            hover:bg-muted
            focus:bg-muted
            outline-none
          "
        >
          <div className="font-medium truncate">
            {entry.prompt.name}
          </div>

          {entry.prompt.description && (
            <div className="text-xs text-muted-foreground truncate">
              {entry.prompt.description}
            </div>
          )}
        </DropdownMenu.Item>
      ))}
    </>
  );
}


/* ───────────────── MCP RESOURCE BUTTON ───────────────── */

export interface McpResourceButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onInsertResource: (id: string, label: string) => void;
  value: string;
  className?: string;
}

export const McpResourceButton = React.forwardRef<
  HTMLButtonElement,
  McpResourceButtonProps
>(({ className, onInsertResource, ...props }, ref) => {
  const { data: resourceList, isLoading } =
    useTamboMcpResourceList();

  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredResources = React.useMemo(() => {
    if (!resourceList) return [];
    if (!searchQuery) return resourceList;

    const q = searchQuery.toLowerCase();
    return resourceList.filter((r) =>
      [r.resource.uri, r.resource.name, r.resource.description]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [resourceList, searchQuery]);

  if (!resourceList || resourceList.length === 0) return null;

  const buttonClasses = cn(
    `
      flex h-9 w-9 items-center justify-center
      rounded-md
      border
      bg-background
      text-foreground
      transition-colors
      hover:bg-muted
      focus-visible:outline-none
      focus-visible:ring-1 focus-visible:ring-ring
    `,
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip content="Insert MCP resource" side="top">
        <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={buttonClasses}
              aria-label="Insert MCP Resource"
              {...props}
            >
              <AtSign className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={6}
              className="
                z-50 w-[420px]
                rounded-md
                border
                bg-popover
                shadow-md
                overflow-hidden
              "
            >
              {/* Search */}
              <div className="border-b p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources"
                    className="
                      w-full rounded-md border
                      bg-background
                      pl-8 pr-3 py-1.5
                      text-sm
                      focus:outline-none
                      focus:ring-1 focus:ring-ring
                    "
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto p-1">
                {isLoading ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Loading resources…
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No matching resources
                  </div>
                ) : (
                  filteredResources.map((entry) => (
                    <DropdownMenu.Item
                      key={entry.resource.uri}
                      onSelect={() => {
                        onInsertResource(
                          entry.resource.uri,
                          entry.resource.name ??
                            entry.resource.uri,
                        );
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="
                        cursor-pointer rounded-md px-3 py-2
                        hover:bg-muted
                        focus:bg-muted
                        outline-none
                      "
                    >
                      <div className="text-sm truncate">
                        {entry.resource.name ??
                          "Unnamed resource"}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground truncate">
                        {entry.resource.uri}
                      </div>
                    </DropdownMenu.Item>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Tooltip>
    </TooltipProvider>
  );
});
McpResourceButton.displayName = "McpResourceButton";