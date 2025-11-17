"use client";

import type { Editor } from "@tiptap/react";
import * as React from "react";

interface MessageThreadPanelContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  togglePanel: () => void;
  editorRef: React.MutableRefObject<Editor | null>;
}

const MessageThreadPanelContext =
  React.createContext<MessageThreadPanelContextType | null>(null);

export function MessageThreadPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editorRef = React.useRef<Editor | null>(null);

  const togglePanel = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      togglePanel,
      editorRef,
    }),
    [isOpen, togglePanel],
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
