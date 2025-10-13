"use client";

import * as React from "react";

interface MessageThreadPanelContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  togglePanel: () => void;
}

const MessageThreadPanelContext =
  React.createContext<MessageThreadPanelContextType | null>(null);

export function MessageThreadPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const togglePanel = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      togglePanel,
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
