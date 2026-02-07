import {
  type TamboCurrentComponent,
  useTambo,
  useTamboCurrentComponent,
  useTamboThreadInput,
} from "@tambo-ai/react";
import * as React from "react";
import {
  EditWithTamboButtonContext,
  type EditWithTamboButtonSendMode,
} from "./edit-with-tambo-button-context";

/**
 * Minimal interface for a TipTap-like editor instance.
 * Only the methods used for "Send in Thread" text insertion are required.
 * Uses broad `commands` signatures to remain compatible with TipTap's Editor type.
 */
interface EditorLike {
  commands: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setContent: (...args: any[]) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    focus: (...args: any[]) => any;
  };
}

/**
 * Props passed to the Root render function.
 */
export interface EditWithTamboButtonRootRenderProps {
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
  /** The current send mode. */
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
  /** Ref for the textarea element. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Tooltip text for the button. */
  tooltip: string;
  /** Optional callback to open the thread panel. */
  onOpenThread?: () => void;
  /** Close the popover and clear the prompt. */
  closeAndReset: () => void;
}

export interface EditWithTamboButtonRootProps {
  /** Children as ReactNode or render function receiving root state. */
  children?:
    | React.ReactNode
    | ((props: EditWithTamboButtonRootRenderProps) => React.ReactNode);
  /** Render function receiving root state. Alternative to children. */
  render?: (props: EditWithTamboButtonRootRenderProps) => React.ReactNode;
  /** Custom tooltip text. Defaults to "Edit with tambo". */
  tooltip?: string;
  /** Optional callback to open the thread panel/chat interface. */
  onOpenThread?: () => void;
  /**
   * Optional TipTap editor ref for inserting text when using "Send in Thread".
   *
   * NOTE: This implementation uses simple text insertion (setContent) to remain
   * portable across different editor setups. It does NOT use TipTap Mention nodes
   * or context attachments.
   */
  editorRef?: { readonly current: EditorLike | null };
}

/**
 * Root primitive for the edit-with-tambo-button compound component.
 * Provides context for all child sub-components. Manages prompt state,
 * send mode, popover visibility, and submission logic.
 *
 * Renders nothing if the current component is not an interactable or if
 * it belongs to a Tambo thread (has a threadId).
 * @returns The root provider wrapping children, or null if not applicable.
 */
export function EditWithTamboButtonRoot({
  children,
  render,
  tooltip = "Edit with tambo",
  onOpenThread,
  editorRef,
}: EditWithTamboButtonRootProps) {
  const component = useTamboCurrentComponent();
  const { sendThreadMessage, isIdle, setInteractableSelected } = useTambo();
  const { setValue: setThreadInputValue } = useTamboThreadInput();

  const [prompt, setPrompt] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [sendMode, setSendMode] =
    React.useState<EditWithTamboButtonSendMode>("send");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [shouldCloseOnComplete, setShouldCloseOnComplete] =
    React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isGenerating = !isIdle;

  // Close popover when generation completes
  React.useEffect(() => {
    if (shouldCloseOnComplete && !isGenerating) {
      setShouldCloseOnComplete(false);
      setIsOpen(false);
      setPrompt("");
    }
  }, [shouldCloseOnComplete, isGenerating]);

  const closeAndReset = React.useCallback(() => {
    setIsOpen(false);
    setPrompt("");
  }, []);

  const handleSend = React.useCallback(async () => {
    if (!prompt.trim() || isGenerating || !component) {
      return;
    }

    setShouldCloseOnComplete(true);

    await sendThreadMessage(prompt.trim(), {
      streamResponse: true,
      additionalContext: {
        inlineEdit: {
          componentId: component.interactableId,
          instruction:
            "The user wants to edit this specific component inline. Please update the component's props to fulfill the user's request.",
        },
      },
    });

    setPrompt("");
  }, [prompt, isGenerating, component, sendThreadMessage]);

  const handleSendInThread = React.useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    const messageToInsert = prompt.trim();

    const interactableId = component?.interactableId ?? "";
    if (interactableId) {
      setInteractableSelected(interactableId, true);
    }

    if (onOpenThread) {
      onOpenThread();
    }

    setPrompt("");
    setIsOpen(false);

    if (editorRef?.current) {
      const editor = editorRef.current;
      editor.commands.setContent(messageToInsert);
      editor.commands.focus("end");
    } else {
      setThreadInputValue(messageToInsert);
    }
  }, [
    prompt,
    component,
    onOpenThread,
    editorRef,
    setInteractableSelected,
    setThreadInputValue,
  ]);

  const handleMainAction = React.useCallback(() => {
    if (sendMode === "thread") {
      handleSendInThread();
    } else {
      void handleSend();
    }
  }, [sendMode, handleSendInThread, handleSend]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleMainAction();
      }
    },
    [handleMainAction],
  );

  // If no component, the current component is not an interactable - don't render.
  if (!component) {
    return null;
  }

  // If in a Tambo thread (message with threadId), don't show the button
  if (component.threadId) {
    return null;
  }

  const renderProps: EditWithTamboButtonRootRenderProps = {
    component,
    prompt,
    setPrompt,
    isOpen,
    setIsOpen,
    isGenerating,
    sendMode,
    setSendMode,
    isDropdownOpen: dropdownOpen,
    setDropdownOpen,
    handleMainAction,
    handleKeyDown,
    textareaRef,
    tooltip,
    onOpenThread,
    closeAndReset,
  };

  const contextValue: React.ContextType<typeof EditWithTamboButtonContext> = {
    ...renderProps,
  };

  let renderedContent: React.ReactNode;
  if (typeof children === "function") {
    renderedContent = children(renderProps);
  } else if (children != null) {
    renderedContent = children;
  } else if (render) {
    renderedContent = render(renderProps);
  } else {
    renderedContent = null;
  }

  return (
    <EditWithTamboButtonContext.Provider value={contextValue}>
      {renderedContent}
    </EditWithTamboButtonContext.Provider>
  );
}
EditWithTamboButtonRoot.displayName = "EditWithTamboButton.Root";
