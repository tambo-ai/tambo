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

/**
 * Represents a single message content item from an MCP prompt.
 */
interface PromptMessageContent {
  type?: string;
  text?: string;
}

/**
 * Represents a single message from an MCP prompt.
 */
interface PromptMessage {
  content?: PromptMessageContent;
}

/**
 * Validates that prompt data has a valid messages array structure.
 * @param promptData - The prompt data to validate
 * @returns true if the prompt data has valid messages, false otherwise
 */
function isValidPromptData(
  promptData: unknown,
): promptData is { messages: PromptMessage[] } {
  if (!promptData || typeof promptData !== "object") {
    return false;
  }

  const data = promptData as { messages?: unknown };
  if (!Array.isArray(data.messages)) {
    return false;
  }

  return true;
}

/**
 * Safely extracts text content from prompt messages.
 * Handles malformed or missing content gracefully.
 * @param messages - Array of prompt messages
 * @returns Extracted text content joined by newlines
 */
function extractPromptText(messages: PromptMessage[]): string {
  return messages
    .map((msg) => {
      // Safely access nested properties
      if (
        msg?.content?.type === "text" &&
        typeof msg.content.text === "string"
      ) {
        return msg.content.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Props for the McpPromptButton component.
 */
export interface McpPromptButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Callback to insert text into the input */
  onInsertText: (text: string) => void;
  /** Current input value */
  value: string;
  /** Optional custom className */
  className?: string;
}

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * @component McpPromptButton
 * @example
 * ```tsx
 * <McpPromptButton
 *   value={inputValue}
 *   onInsertText={(text) => setInputValue(text)}
 * />
 * ```
 */
export const McpPromptButton = React.forwardRef<
  HTMLButtonElement,
  McpPromptButtonProps
>(({ className, onInsertText, value, ...props }, ref) => {
  const { data: promptList, isLoading } = useTamboMcpPromptList();
  const [selectedPromptName, setSelectedPromptName] = React.useState<
    string | null
  >(null);
  const [promptError, setPromptError] = React.useState<string | null>(null);
  const { data: promptData, error: fetchError } = useTamboMcpPrompt(
    selectedPromptName ?? "",
  );

  // When prompt data is fetched, validate and insert it into the input
  React.useEffect(() => {
    if (selectedPromptName && promptData) {
      // Validate prompt data structure
      if (!isValidPromptData(promptData)) {
        setPromptError("Invalid prompt format received");
        setSelectedPromptName(null);
        return;
      }

      // Extract text with safe access
      const promptText = extractPromptText(promptData.messages);

      if (!promptText) {
        setPromptError("Prompt contains no text content");
        setSelectedPromptName(null);
        return;
      }

      // Clear any previous errors
      setPromptError(null);

      // Insert the prompt text, appending to existing value if any
      const newValue = value ? `${value}\n\n${promptText}` : promptText;
      onInsertText(newValue);

      // Reset the selected prompt
      setSelectedPromptName(null);
    }
  }, [promptData, selectedPromptName, onInsertText, value]);

  // Handle fetch errors
  React.useEffect(() => {
    if (fetchError) {
      setPromptError("Failed to load prompt");
      setSelectedPromptName(null);
    }
  }, [fetchError]);

  // Clear error after a delay
  React.useEffect(() => {
    if (promptError) {
      const timer = setTimeout(() => setPromptError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [promptError]);

  // Only show button if prompts are available (hide during loading and when no prompts)
  if (!promptList || promptList.length === 0) {
    return null;
  }

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip
        content={promptError ?? "Insert MCP Prompt"}
        side="top"
        className={cn(
          "bg-muted text-foreground",
          promptError && "bg-destructive text-destructive-foreground",
        )}
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={cn(
                buttonClasses,
                promptError && "border-destructive text-destructive",
              )}
              aria-label="Insert MCP Prompt"
              data-slot="mcp-prompt-button"
              {...props}
            >
              {promptError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] max-w-[300px] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
              side="top"
              align="start"
              sideOffset={5}
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

/**
 * Internal component to render prompt list content
 */
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
      <DropdownMenu.Item
        className="px-2 py-1.5 text-sm text-muted-foreground"
        disabled
      >
        Loading prompts...
      </DropdownMenu.Item>
    );
  }
  if (!promptList || promptList.length === 0) {
    return (
      <DropdownMenu.Item
        className="px-2 py-1.5 text-sm text-muted-foreground"
        disabled
      >
        No prompts available
      </DropdownMenu.Item>
    );
  }
  return (
    <>
      {promptList.map((promptEntry) => (
        <DropdownMenu.Item
          key={`${promptEntry.server.url}-${promptEntry.prompt.name}`}
          className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          onSelect={() => {
            onSelectPrompt(promptEntry.prompt.name);
          }}
        >
          <span className="font-medium truncate max-w-full">
            {promptEntry.prompt.name}
          </span>
          {promptEntry.prompt.description && (
            <span className="text-xs text-muted-foreground truncate max-w-full">
              {promptEntry.prompt.description}
            </span>
          )}
        </DropdownMenu.Item>
      ))}
    </>
  );
}

/**
 * Props for the ResourceCombobox internal component
 */
interface ResourceComboboxProps {
  setIsOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredResources: ReturnType<typeof useTamboMcpResourceList>["data"];
  isLoading: boolean;
  onSelectResource: (id: string, label: string) => void;
}

/**
 * Internal combobox component for MCP resource selection with search functionality.
 * Not exported - only used within McpResourceButton.
 */
const ResourceCombobox: React.FC<ResourceComboboxProps> = ({
  searchQuery,
  setSearchQuery,
  filteredResources,
  isLoading,
  onSelectResource,
  setIsOpen,
}) => {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className="z-50 w-[400px] max-h-[400px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        side="top"
        align="start"
        sideOffset={5}
        onCloseAutoFocus={(e) => {
          // Prevent focus from moving when closing
          e.preventDefault();
        }}
      >
        {/* Search input */}
        <div className="sticky top-0 bg-popover border-b border-border p-2 z-10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // Prevent dropdown from closing on key events
                e.stopPropagation();
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* Resource list */}
        <div className="overflow-y-auto max-h-[320px] p-1">
          <ResourceListContent
            isLoading={isLoading}
            filteredResources={filteredResources}
            searchQuery={searchQuery}
            onSelectResource={onSelectResource}
          />
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
};

/**
 * Internal component to render resource list content
 */
function ResourceListContent({
  isLoading,
  filteredResources,
  searchQuery,
  onSelectResource,
}: {
  isLoading: boolean;
  filteredResources: ReturnType<typeof useTamboMcpResourceList>["data"];
  searchQuery: string;
  onSelectResource: (id: string, label: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
        Loading resources...
      </div>
    );
  }
  if (!filteredResources || filteredResources.length === 0) {
    return (
      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
        {searchQuery
          ? `No resources matching "${searchQuery}"`
          : "No resources available"}
      </div>
    );
  }
  return (
    <>
      {filteredResources.map((resourceEntry) => (
        <DropdownMenu.Item
          key={resourceEntry.resource.uri}
          className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
          onSelect={() => {
            onSelectResource(
              resourceEntry.resource.uri,
              resourceEntry.resource.name || resourceEntry.resource.uri,
            );
          }}
        >
          <div className="flex items-start justify-between w-full gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {resourceEntry.resource.name ?? "Unnamed Resource"}
              </div>
              <div className="text-xs text-muted-foreground truncate font-mono">
                {resourceEntry.resource.uri}
              </div>
              {resourceEntry.resource.description && (
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {resourceEntry.resource.description}
                </div>
              )}
            </div>
          </div>
        </DropdownMenu.Item>
      ))}
    </>
  );
}

/**
 * Props for the McpResourceButton component.
 */
export interface McpResourceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Callback to insert text into the input */
  onInsertResource: (id: string, label: string) => void;
  /** Current input value */
  value: string;
  /** Optional custom className */
  className?: string;
}

/**
 * MCP Resource picker button component for inserting resource references from MCP servers.
 * Uses a combobox with search for easy filtering of potentially many resources.
 * @component McpResourceButton
 * @example
 * ```tsx
 * <McpResourceButton
 *   value={inputValue}
 *   onInsertText={(text) => setInputValue(text)}
 * />
 * ```
 */
export const McpResourceButton = React.forwardRef<
  HTMLButtonElement,
  McpResourceButtonProps
>(({ className, onInsertResource, value: _value, ...props }, ref) => {
  const { data: resourceList, isLoading } = useTamboMcpResourceList();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter resources based on search query
  const filteredResources = React.useMemo(() => {
    if (!resourceList) return [];
    if (!searchQuery) return resourceList;

    const query = searchQuery.toLowerCase();
    return resourceList.filter((entry) => {
      const uri = entry.resource.uri.toLowerCase();
      const name = entry.resource.name?.toLowerCase() ?? "";
      const description = entry.resource.description?.toLowerCase() ?? "";
      // Combine predicates without `||` to satisfy lint rule preferring `??` for fallbacks
      // Ensure correct boolean semantics by using Array.prototype.some
      return [
        uri.includes(query),
        name.includes(query),
        description.includes(query),
      ].some(Boolean);
    });
  }, [resourceList, searchQuery]);

  const handleSelectResource = (id: string, label: string) => {
    // Pass raw resource string to caller; caller decides how to insert
    onInsertResource(id, label);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Only show button if resources are available
  if (!resourceList || resourceList.length === 0) {
    return null;
  }

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <TooltipProvider>
      <Tooltip
        content="Insert MCP Resource"
        side="top"
        className="bg-muted text-foreground"
      >
        <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={buttonClasses}
              aria-label="Insert MCP Resource"
              data-slot="mcp-resource-button"
              {...props}
            >
              <AtSign className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <ResourceCombobox
            setIsOpen={setIsOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredResources={filteredResources}
            isLoading={isLoading}
            onSelectResource={handleSelectResource}
          />
        </DropdownMenu.Root>
      </Tooltip>
    </TooltipProvider>
  );
});
McpResourceButton.displayName = "McpResourceButton";
