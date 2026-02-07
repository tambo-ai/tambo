import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import {
  ControlBarRootContext,
  type ControlBarRootContextValue,
} from "./control-bar-root-context";

/**
 * Props passed to the Root render function.
 */
export interface ControlBarRootRenderProps {
  /** Whether the control bar dialog is open. */
  isOpen: boolean;
  /** Set the open state. */
  setOpen: (value: boolean) => void;
  /** The configured hotkey string (e.g. "mod+k"). */
  hotkey: string;
  /** Whether the current platform is macOS. */
  isMac: boolean;
  /** Display-friendly hotkey string (e.g. "⌘K" or "Ctrl+K"). */
  hotkeyDisplay: string;
  /** Whether the thread has messages to display. */
  hasMessages: boolean;
}

export interface ControlBarRootProps {
  /** Children as ReactNode or render function receiving root state. */
  children?:
    | React.ReactNode
    | ((props: ControlBarRootRenderProps) => React.ReactNode);
  /** Render function receiving root state. Alternative to children. */
  render?: (props: ControlBarRootRenderProps) => React.ReactNode;
  /** Keyboard shortcut for toggling the control bar (default: "mod+k"). */
  hotkey?: string;
}

/**
 * Root primitive for the control-bar compound component.
 * Manages dialog open/close state and keyboard shortcut registration.
 * Does not render any DOM element — purely provides context and behavior.
 * @returns The root provider wrapping children, or null.
 */
export function ControlBarRoot({
  children,
  render,
  hotkey = "mod+k",
}: ControlBarRootProps) {
  const [isOpen, setOpen] = React.useState(false);
  const { thread } = useTambo();

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

  const hasMessages = (thread?.messages?.length ?? 0) > 0;

  const hotkeyDisplay = React.useMemo(() => {
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
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [hotkey]);

  const renderProps: ControlBarRootRenderProps = {
    isOpen,
    setOpen,
    hotkey,
    isMac,
    hotkeyDisplay,
    hasMessages,
  };

  const contextValue: ControlBarRootContextValue = {
    ...renderProps,
  };

  let renderedContent: React.ReactNode;
  if (render) {
    renderedContent = render(renderProps);
  } else if (typeof children === "function") {
    renderedContent = children(renderProps);
  } else {
    renderedContent = children;
  }

  return (
    <ControlBarRootContext.Provider value={contextValue}>
      {renderedContent}
    </ControlBarRootContext.Provider>
  );
}
ControlBarRoot.displayName = "ControlBar.Root";
