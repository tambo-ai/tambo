"use client";

import {
  Content as PopoverContent,
  Portal as PopoverPortal,
  Root as PopoverRoot,
  Trigger as PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Content as TooltipContent,
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type { TamboCurrentComponent } from "@tambo-ai/react";
import type { EditWithTamboButtonSendMode } from "@tambo-ai/react-ui-base/edit-with-tambo-button";
import { EditWithTamboButtonBase } from "@tambo-ai/react-ui-base/edit-with-tambo-button";
import { MessageGenerationStage } from "@tambo-ai/ui-registry/components/message-suggestions";
import { cn } from "@tambo-ai/ui-registry/utils";
import type { Editor } from "@tiptap/react";
import { Bot, ChevronDown, X } from "lucide-react";
import * as React from "react";

export interface EditWithTamboButtonProps {
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Custom tooltip text */
  tooltip?: string;
  /** Description for tooltip. Falls back to interactable component description if not provided */
  description?: string;
  /** Optional className for the button */
  className?: string;
  /** Optional callback to open the thread panel/chat interface */
  onOpenThread?: () => void;
  /**
   * Optional TipTap editor ref for inserting text when using "Send in Thread"
   *
   * NOTE: This implementation uses simple text insertion (setContent) to remain
   * portable across different editor setups. It does NOT use TipTap Mention nodes
   * or context attachments. If you need those features, implement them in your
   * own wrapper or see apps/web/components/ui/tambo/edit-with-tambo-button.tsx for reference.
   */
  editorRef?: React.MutableRefObject<Editor | null>;
}

interface StyledTriggerProps {
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  tooltip: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  component: TamboCurrentComponent;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  closeAndReset: () => void;
  sendMode: EditWithTamboButtonSendMode;
  isDropdownOpen: boolean;
  setDropdownOpen: (value: boolean) => void;
}

/**
 * Styled trigger button with tooltip.
 * @returns The trigger button with tooltip wrapping.
 */
function StyledTrigger({
  icon,
  description,
  className,
  tooltip,
  isOpen,
  setIsOpen,
  component,
  textareaRef,
  closeAndReset,
  sendMode,
  isDropdownOpen,
  setDropdownOpen,
}: StyledTriggerProps) {
  return (
    <TooltipProvider>
      <PopoverRoot open={isOpen} onOpenChange={setIsOpen}>
        <TooltipRoot delayDuration={300}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <EditWithTamboButtonBase.Trigger
                className={cn(
                  "inline-flex items-center justify-center ml-2 p-1 rounded-md",
                  "text-muted-foreground/60 hover:text-primary",
                  "hover:bg-accent transition-colors duration-200",
                  "cursor-pointer",
                  isOpen && "text-primary bg-accent",
                  className,
                )}
              >
                {icon ?? <Bot className="h-3.5 w-3.5" />}
              </EditWithTamboButtonBase.Trigger>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="z-50 overflow-hidden rounded-lg bg-popover text-popover-foreground border shadow-md px-3 py-2 text-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          >
            <div className="space-y-1">
              <p className="font-medium">{tooltip}</p>
              <p className="text-xs opacity-70 text-foreground">
                {description ?? component.description}
              </p>
            </div>
          </TooltipContent>
        </TooltipRoot>

        <PopoverPortal>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              textareaRef.current?.focus();
            }}
            className={cn(
              "z-50 w-[450px] max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            )}
          >
            <StyledPopoverContent
              tooltip={tooltip}
              component={component}
              closeAndReset={closeAndReset}
              sendMode={sendMode}
              isDropdownOpen={isDropdownOpen}
              setDropdownOpen={setDropdownOpen}
            />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </TooltipProvider>
  );
}

interface StyledPopoverContentProps {
  tooltip: string;
  component: TamboCurrentComponent;
  closeAndReset: () => void;
  sendMode: EditWithTamboButtonSendMode;
  isDropdownOpen: boolean;
  setDropdownOpen: (value: boolean) => void;
}

/**
 * Styled popover content with header, textarea, status, and send button.
 * @returns The popover inner content.
 */
function StyledPopoverContent({
  tooltip,
  component,
  closeAndReset,
  sendMode,
  isDropdownOpen,
  setDropdownOpen,
}: StyledPopoverContentProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{tooltip}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {component.componentName}
          </p>
        </div>
        <button
          type="button"
          onClick={closeAndReset}
          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Prompt input */}
      <div className="space-y-3">
        <EditWithTamboButtonBase.Textarea
          placeholder="Describe what you want to change..."
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input",
            "bg-transparent px-3 py-2 text-sm shadow-sm",
            "placeholder:text-muted-foreground resize-none",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <div className="flex items-center justify-between">
          {/* Helper text or generation status */}
          <EditWithTamboButtonBase.Status>
            {({ isGenerating: generating, onOpenThread: openThread }) => {
              if (generating && openThread) {
                return (
                  <div className="flex items-center gap-2">
                    <MessageGenerationStage className="px-0 py-0" />
                    <button
                      type="button"
                      onClick={openThread}
                      className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                    >
                      View in thread
                    </button>
                  </div>
                );
              }
              return (
                <p className="text-xs text-muted-foreground">
                  Cmd/Ctrl + Enter to send
                </p>
              );
            }}
          </EditWithTamboButtonBase.Status>
          <div className="flex items-center">
            <EditWithTamboButtonBase.SendButton
              className={cn(
                "h-9 px-3 text-sm font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors flex items-center gap-1",
                "rounded-l-md border-r border-primary-foreground/20",
              )}
            />
            <PopoverRoot open={isDropdownOpen} onOpenChange={setDropdownOpen}>
              <PopoverTrigger asChild>
                <EditWithTamboButtonBase.SendModeDropdown
                  className={cn(
                    "h-9 px-2 text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors rounded-r-md",
                    "flex items-center justify-center",
                  )}
                >
                  <ChevronDown className="h-3 w-3" />
                </EditWithTamboButtonBase.SendModeDropdown>
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={4}
                  className="z-50 w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                  <EditWithTamboButtonBase.SendModeOption
                    mode="send"
                    className={cn(
                      "w-full px-2 py-1.5 text-left text-sm rounded-sm",
                      "hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                      "focus:bg-accent focus:text-accent-foreground outline-none",
                      sendMode === "send" && "bg-accent text-accent-foreground",
                    )}
                  >
                    Send
                  </EditWithTamboButtonBase.SendModeOption>
                  <EditWithTamboButtonBase.SendModeOption
                    mode="thread"
                    className={cn(
                      "w-full px-2 py-1.5 text-left text-sm rounded-sm",
                      "hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                      "focus:bg-accent focus:text-accent-foreground outline-none",
                      sendMode === "thread" &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    Send in Thread
                  </EditWithTamboButtonBase.SendModeOption>
                </PopoverContent>
              </PopoverPortal>
            </PopoverRoot>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline "Edit with Tambo" button and floating popover for interactable components.
 * When clicked, opens a floating popover with a prompt input. Sends messages to Tambo
 * with the interactable component in context and displays only the latest reply.
 *
 * Must be used within a component wrapped with `withInteractable`.
 *
 * @example
 * ```tsx
 * const MyInteractableForm = withInteractable(MyForm, {
 *   componentName: "MyForm",
 *   description: "A form component",
 * });
 *
 * function MyForm() {
 *   return (
 *     <div>
 *       <EditWithTamboButton />
 *     </div>
 *   );
 * }
 * ```
 * @returns The edit-with-tambo button with popover, or null if not in an interactable context.
 */
export function EditWithTamboButton({
  icon,
  tooltip = "Edit with tambo",
  description,
  className,
  onOpenThread,
  editorRef,
}: EditWithTamboButtonProps) {
  return (
    <EditWithTamboButtonBase.Root
      tooltip={tooltip}
      onOpenThread={onOpenThread}
      editorRef={editorRef}
    >
      {(renderProps) => (
        <StyledTrigger
          icon={icon}
          description={description}
          className={className}
          tooltip={renderProps.tooltip}
          isOpen={renderProps.isOpen}
          setIsOpen={renderProps.setIsOpen}
          component={renderProps.component}
          textareaRef={renderProps.textareaRef}
          closeAndReset={renderProps.closeAndReset}
          sendMode={renderProps.sendMode}
          isDropdownOpen={renderProps.isDropdownOpen}
          setDropdownOpen={renderProps.setDropdownOpen}
        />
      )}
    </EditWithTamboButtonBase.Root>
  );
}
