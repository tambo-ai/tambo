import type { TamboCurrentComponent } from "@tambo-ai/react";
import * as React from "react";

export type EditWithTamboButtonSendMode = "send" | "thread";

/**
 * Context value shared among EditWithTamboButton primitive sub-components.
 */
export interface EditWithTamboButtonContextValue {
  /** The current interactable component metadata. */
  component: TamboCurrentComponent;
  /** The current prompt text. */
  prompt: string;
  /** Set the prompt text. */
  setPrompt: (value: string) => void;
  /** Whether the popover is open. */
  isOpen: boolean;
  /** Set the popover open state. */
  setIsOpen: (value: boolean) => void;
  /** Whether the AI is currently generating a response. */
  isGenerating: boolean;
  /** The current send mode ("send" for inline edit, "thread" for thread). */
  sendMode: EditWithTamboButtonSendMode;
  /** Set the send mode. */
  setSendMode: (mode: EditWithTamboButtonSendMode) => void;
  /** Whether the send mode dropdown is open. */
  isDropdownOpen: boolean;
  /** Set the send mode dropdown open state. */
  setDropdownOpen: (value: boolean) => void;
  /** Execute the main action (send or send-in-thread based on current mode). */
  handleMainAction: () => void;
  /** Handle keyboard events on the textarea (Cmd/Ctrl+Enter to send). */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Ref for the textarea element (used for auto-focus). */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Tooltip text for the button. */
  tooltip: string;
  /** Optional callback to open the thread panel. */
  onOpenThread?: () => void;
  /** Close the popover and clear the prompt. */
  closeAndReset: () => void;
}

const EditWithTamboButtonContext =
  React.createContext<EditWithTamboButtonContextValue | null>(null);

/**
 * Hook to access the edit-with-tambo-button context.
 * @returns The edit-with-tambo-button context value
 * @throws Error if used outside of EditWithTamboButton.Root
 */
function useEditWithTamboButtonContext(): EditWithTamboButtonContextValue {
  const context = React.useContext(EditWithTamboButtonContext);
  if (!context) {
    throw new Error(
      "React UI Base: EditWithTamboButtonContext is missing. EditWithTamboButton parts must be used within <EditWithTamboButton.Root>",
    );
  }
  return context;
}

export { EditWithTamboButtonContext, useEditWithTamboButtonContext };
