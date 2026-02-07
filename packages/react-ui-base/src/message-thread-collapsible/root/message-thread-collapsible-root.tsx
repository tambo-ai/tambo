import * as React from "react";
import {
  MessageThreadCollapsibleContext,
  type MessageThreadCollapsibleContextValue,
} from "./message-thread-collapsible-context";

/**
 * Props passed to the Root render function.
 */
export type MessageThreadCollapsibleRootRenderProps =
  MessageThreadCollapsibleContextValue;

export interface MessageThreadCollapsibleRootProps {
  /** Children as ReactNode or render function receiving root state. */
  children?:
    | React.ReactNode
    | ((props: MessageThreadCollapsibleRootRenderProps) => React.ReactNode);
  /**
   * Render function receiving root state. Alternative to children.
   * @deprecated Use children-as-function instead.
   */
  render?: (
    props: MessageThreadCollapsibleRootRenderProps,
  ) => React.ReactNode;
  /** Keyboard shortcut for toggling the collapsible (format: "mod+key", default: "mod+k"). */
  hotkey?: string;
  /** Whether the collapsible should be open by default (default: false). */
  defaultOpen?: boolean;
}

const isMac =
  typeof navigator !== "undefined" &&
  /mac/i.test(navigator.platform || navigator.userAgent);

function resolveContent(
  children: MessageThreadCollapsibleRootProps["children"],
  render: MessageThreadCollapsibleRootProps["render"],
  renderProps: MessageThreadCollapsibleRootRenderProps,
): React.ReactNode {
  if (typeof children === "function") return children(renderProps);
  if (children != null) return children;
  if (render) return render(renderProps);
  return null;
}

function parseHotkey(hotkey: string): { modifier: string; key: string } {
  const parts = hotkey.split("+");
  if (parts.length !== 2 || parts[0] !== "mod") {
    throw new Error(
      `MessageThreadCollapsible.Root: invalid hotkey "${hotkey}". Expected format: "mod+<key>" (e.g. "mod+k").`,
    );
  }
  return { modifier: parts[0], key: parts[1] };
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
  const contentId = React.useId();

  const { key } = parseHotkey(hotkey);

  const shortcutText = React.useMemo(() => {
    const modDisplay = isMac ? "⌘" : "Ctrl+";
    return `${modDisplay}${key.toUpperCase()}`;
  }, [key]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === key && isModifierPressed) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [key]);

  const onThreadChange = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const contextValue = React.useMemo<MessageThreadCollapsibleContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      shortcutText,
      hotkey,
      isMac,
      onThreadChange,
      contentId,
    }),
    [isOpen, shortcutText, hotkey, onThreadChange, contentId],
  );

  const content = resolveContent(children, render, contextValue);

  return (
    <MessageThreadCollapsibleContext.Provider value={contextValue}>
      {content}
    </MessageThreadCollapsibleContext.Provider>
  );
}
MessageThreadCollapsibleRoot.displayName = "MessageThreadCollapsible.Root";
