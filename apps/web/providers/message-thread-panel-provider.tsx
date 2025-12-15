"use client";

import type { TamboEditor } from "@/components/ui/tambo/text-editor";
import * as React from "react";

interface MessageThreadPanelContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  togglePanel: () => void;
  editorRef: React.MutableRefObject<TamboEditor | null>;
  /** Context key for thread caching - consistent across panel and inline edits */
  contextKey: string;
}

const MessageThreadPanelContext =
  React.createContext<MessageThreadPanelContextType | null>(null);

export function MessageThreadPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editorRef = React.useRef<TamboEditor | null>(null);

  // Generate or retrieve contextKey only once on mount
  const [contextKey] = React.useState<string>(() => {
    // Defensive UUID generation for environments where crypto.randomUUID may not be available
    const generateUUID = () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Check if we're in the browser before accessing localStorage
    if (typeof window === "undefined") {
      return `session-${generateUUID()}`;
    }
    const stored = localStorage.getItem("tambo-context-key");
    if (stored) return stored;
    const newKey = `session-${generateUUID()}`;
    localStorage.setItem("tambo-context-key", newKey);
    return newKey;
  });

  const togglePanel = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      togglePanel,
      editorRef,
      contextKey,
    }),
    [isOpen, togglePanel, contextKey],
  );

  return (
    <MessageThreadPanelContext.Provider value={value}>
      {children}
    </MessageThreadPanelContext.Provider>
  );
}

export function useMessageThreadPanel() {
  const context = React.useContext(MessageThreadPanelContext);
  if (!context) {
    throw new Error(
      "useMessageThreadPanel must be used within MessageThreadPanelProvider",
    );
  }
  return context;
}
