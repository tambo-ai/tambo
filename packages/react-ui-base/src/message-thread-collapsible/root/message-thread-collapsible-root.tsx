import * as React from "react";
import {
  MessageThreadCollapsibleContext,
  type MessageThreadCollapsibleContextValue,
} from "./message-thread-collapsible-context";

/**
 * Props passed to the Root render function.
 */
export interface MessageThreadCollapsibleRootRenderProps {
  /** Whether the collapsible thread is open. */
  isOpen: boolean;
  /** Set the open/close state. */
  setIsOpen: (value: boolean) => void;
  /** Display-friendly shortcut string (e.g. "⌘K" or "Ctrl+K"). */
  shortcutText: string;
  /** The configured hotkey string (e.g. "mod+k"). */
  hotkey: string;
  /** Whether the current platform is macOS. */
  isMac: boolean;
  /** Callback to invoke when the active thread changes. Opens the collapsible. */
  onThreadChange: () => void;
}

export interface MessageThreadCollapsibleRootProps {
  /** Children as ReactNode or render function receiving root state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadCollapsibleRootRenderProps) => React.ReactNode);
  /** Render function receiving root state. Alternative to children. */
  render?: (
    props: MessageThreadCollapsibleRootRenderProps,
  ) => React.ReactNode;
  /** Keyboard shortcut for toggling the collapsible (default: "mod+k"). */
  hotkey?: string;
  /** Whether the collapsible should be open by default (default: false). */
  defaultOpen?: boolean;
}

/**
 * Root primitive for the message-thread-collapsible compound component.
 * Manages collapsible open/close state and keyboard shortcut registration.
 * Does not render any DOM element — purely provides context and behavior.
 * @returns The root provider wrapping children, or null.
 */
export function MessageThreadCollapsibleRoot({
  children,
  render,
  hotkey = "mod+k",
  defaultOpen = false,
}: MessageThreadCollapsibleRootProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

  const shortcutText = React.useMemo(() => {
    const [modifier, key] = hotkey.split("+");
    let modDisplay = "";
    if (modifier === "mod") {
      modDisplay = isMac ? "⌘" : "Ctrl+";
    }
    return `${modDisplay}${(key ?? "").toUpperCase()}`;
  }, [hotkey, isMac]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const [modifier, key] = hotkey.split("+");
      const isModifierPressed =
        modifier === "mod" ? e.metaKey || e.ctrlKey : false;
      if (e.key === key && isModifierPressed) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [hotkey]);

  const onThreadChange = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const renderProps: MessageThreadCollapsibleRootRenderProps = {
    isOpen,
    setIsOpen,
    shortcutText,
    hotkey,
    isMac,
    onThreadChange,
  };

  const contextValue: MessageThreadCollapsibleContextValue = {
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
    <MessageThreadCollapsibleContext.Provider value={contextValue}>
      {renderedContent}
    </MessageThreadCollapsibleContext.Provider>
  );
}
MessageThreadCollapsibleRoot.displayName = "MessageThreadCollapsible.Root";
