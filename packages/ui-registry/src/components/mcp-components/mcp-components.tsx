"use client";

import {
  Tooltip,
  TooltipProvider,
} from "@tambo-ai/ui-registry/components/message-suggestions";
import { cn } from "@tambo-ai/ui-registry/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { McpPrompts, McpResources } from "@tambo-ai/react-ui-base";
import { AlertCircle, AtSign, FileText, Search } from "lucide-react";
import * as React from "react";

/**
 * Props for the McpPromptButton component.
 */
export interface McpPromptButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Callback to insert text into the input */
  onInsertText: (text: string) => void;
  /** Current input value */
  value: string;
  /** Optional custom className */
  className?: string;
}

/**
 * MCP Prompt picker button component for inserting prompts from MCP servers.
 * Composes the headless McpPrompts base primitives with Radix DropdownMenu styling.
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
  HTMLDivElement,
  McpPromptButtonProps
>(({ className, onInsertText, value, ...props }, ref) => {
  const handleInsertText = React.useCallback(
    (text: string) => {
      const newValue = value ? `${value}\n\n${text}` : text;
      onInsertText(newValue);
    },
    [value, onInsertText],
  );

  return (
    <McpPrompts.Root
      onInsertText={handleInsertText}
      render={(rootProps, rootState) => (
        <StyledPromptPicker
          {...rootProps}
          ref={ref}
          className={className}
          hasError={rootState.status === "error"}
          {...props}
        />
      )}
    />
  );
});
McpPromptButton.displayName = "McpPromptButton";

/**
 * Internal styled prompt picker that composes base McpPrompts parts with Radix DropdownMenu.
 */
const StyledPromptPicker = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
    hasError: boolean;
  }
>(({ className, hasError, ...divProps }, ref) => {
  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <div {...divProps} ref={ref}>
      <TooltipProvider>
        <Tooltip
          content={hasError ? "Prompt error" : "Insert MCP Prompt"}
          side="top"
          className={cn(
            "bg-muted text-foreground",
            hasError && "bg-destructive text-destructive-foreground",
          )}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  buttonClasses,
                  hasError && "border-destructive text-destructive",
                )}
                aria-label="Insert MCP Prompt"
                data-slot="mcp-prompt-button"
              >
                {hasError ? (
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
                <McpPrompts.List
                  render={(listProps, listState) => (
                    <div {...listProps}>
                      {listState.promptCount === 0 ? (
                        <DropdownMenu.Item
                          className="px-2 py-1.5 text-sm text-muted-foreground"
                          disabled
                        >
                          No prompts available
                        </DropdownMenu.Item>
                      ) : (
                        listState.prompts.map((promptEntry) => (
                          <McpPrompts.Item
                            key={`${promptEntry.server.url}-${promptEntry.prompt.name}`}
                            name={promptEntry.prompt.name}
                            description={promptEntry.prompt.description}
                            render={(_itemProps, itemState) => (
                              <DropdownMenu.Item
                                className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                onSelect={() => {
                                  itemState.select();
                                }}
                              >
                                <span className="font-medium truncate max-w-full">
                                  {itemState.name}
                                </span>
                                {itemState.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-full">
                                    {itemState.description}
                                  </span>
                                )}
                              </DropdownMenu.Item>
                            )}
                          />
                        ))
                      )}
                    </div>
                  )}
                />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Tooltip>
      </TooltipProvider>
      <McpPrompts.Error
        render={(errorProps, errorState) => (
          <span {...errorProps} className="sr-only" role="alert">
            {errorState.error}
          </span>
        )}
      />
    </div>
  );
});
StyledPromptPicker.displayName = "StyledPromptPicker";

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
 * Composes the headless McpResources base primitives with Radix DropdownMenu styling.
 * @component McpResourceButton
 * @example
 * ```tsx
 * <McpResourceButton
 *   value={inputValue}
 *   onInsertResource={(uri, label) => handleResource(uri, label)}
 * />
 * ```
 */
export const McpResourceButton = React.forwardRef<
  HTMLButtonElement,
  McpResourceButtonProps
>(({ className, onInsertResource, value: _value, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectResource = React.useCallback(
    (uri: string, label: string) => {
      onInsertResource(uri, label);
      setIsOpen(false);
    },
    [onInsertResource],
  );

  const buttonClasses = cn(
    "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  return (
    <McpResources.Root
      onSelectResource={handleSelectResource}
      render={(rootProps) => (
        <div {...rootProps}>
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
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 w-[400px] max-h-[400px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
                    side="top"
                    align="start"
                    sideOffset={5}
                    onCloseAutoFocus={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <div className="sticky top-0 bg-popover border-b border-border p-2 z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <McpResources.Search
                          placeholder="Search resources..."
                          className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            e.stopPropagation();
                            if (e.key === "Escape") {
                              setIsOpen(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-[320px] p-1">
                      <McpResources.List
                        render={(listProps, listState) => (
                          <div {...listProps}>
                            {listState.resourceCount === 0 ? (
                              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                                No resources available
                              </div>
                            ) : (
                              listState.resources.map((resourceEntry) => (
                                <McpResources.Item
                                  key={resourceEntry.resource.uri}
                                  uri={resourceEntry.resource.uri}
                                  name={resourceEntry.resource.name}
                                  description={
                                    resourceEntry.resource.description
                                  }
                                  render={(_itemProps, itemState) => (
                                    <DropdownMenu.Item
                                      className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                                      onSelect={() => {
                                        itemState.select();
                                      }}
                                    >
                                      <div className="flex items-start justify-between w-full gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium truncate">
                                            {resourceEntry.resource.name ??
                                              "Unnamed Resource"}
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate font-mono">
                                            {resourceEntry.resource.uri}
                                          </div>
                                          {resourceEntry.resource
                                            .description && (
                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                              {
                                                resourceEntry.resource
                                                  .description
                                              }
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </DropdownMenu.Item>
                                  )}
                                />
                              ))
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    />
  );
});
McpResourceButton.displayName = "McpResourceButton";
