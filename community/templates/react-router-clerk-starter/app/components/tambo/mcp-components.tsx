"use client";

import {
    Tooltip,
    TooltipProvider,
} from "~/components/tambo/suggestions-tooltip";
import { cn } from "~/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    useTamboMcpPrompt,
    useTamboMcpPromptList,
} from "@tambo-ai/react/mcp";
import { FileText } from "lucide-react";
import * as React from "react";

/**
 * Props for the McpPromptButton component.
 */
export interface McpPromptButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
    const { data: promptData } = useTamboMcpPrompt(selectedPromptName ?? "");

    // When prompt data is fetched, insert it into the input
    React.useEffect(() => {
        if (promptData && selectedPromptName) {
            // Extract the text from the prompt messages
            const promptText = promptData.messages
                .map((msg) => {
                    if (msg.content.type === "text") {
                        return msg.content.text;
                    }
                    return "";
                })
                .filter(Boolean)
                .join("\n");

            // Insert the prompt text, appending to existing value if any
            const newValue = value ? `${value}\n\n${promptText}` : promptText;
            onInsertText(newValue);

            // Reset the selected prompt
            setSelectedPromptName(null);
        }
    }, [promptData, selectedPromptName, onInsertText, value]);

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
                content="Insert MCP Prompt"
                side="top"
                className="bg-muted text-foreground"
            >
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            ref={ref}
                            type="button"
                            className={buttonClasses}
                            aria-label="Insert MCP Prompt"
                            data-slot="mcp-prompt-button"
                            {...props}
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            className="z-50 min-w-[200px] max-w-[300px] overflow-hidden rounded-md border border-gray-200 bg-popover p-1 text-popover-foreground shadow-md"
                            side="top"
                            align="start"
                            sideOffset={5}
                        >
                            {isLoading ? (
                                <DropdownMenu.Item
                                    className="px-2 py-1.5 text-sm text-muted-foreground"
                                    disabled
                                >
                                    Loading prompts...
                                </DropdownMenu.Item>
                            ) : !promptList || promptList.length === 0 ? (
                                <DropdownMenu.Item
                                    className="px-2 py-1.5 text-sm text-muted-foreground"
                                    disabled
                                >
                                    No prompts available
                                </DropdownMenu.Item>
                            ) : (
                                promptList.map((promptEntry) => (
                                    <DropdownMenu.Item
                                        key={`${promptEntry.server.url}-${promptEntry.prompt.name}`}
                                        className="relative flex cursor-pointer select-none items-start flex-col rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                        onSelect={() => {
                                            setSelectedPromptName(promptEntry.prompt.name);
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
                                ))
                            )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </Tooltip>
        </TooltipProvider>
    );
});
McpPromptButton.displayName = "McpPromptButton";

// McpResourceButton removed as it was unused
