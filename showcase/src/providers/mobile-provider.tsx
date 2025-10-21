"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

// Define a constant for the breakpoint to maintain consistency
export const MOBILE_BREAKPOINT = 768; // matches 'md' in Tailwind

type MobileContextType = {
  // Core mobile state
  isMobile: boolean;

  // Navigation state
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Sidebar state (for desktop)
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Expanded item tracking for navigation dropdowns
  expandedItems: Record<string, boolean>;
  toggleExpandedItem: (id: string) => void;
  resetExpandedItems: () => void;
};

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore for window size - proper SSR/hydration handling
  const isMobile = useSyncExternalStore(
    (callback) => {
      let timeoutId: NodeJS.Timeout;
      const debouncedResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callback, 100);
      };

      window.addEventListener("resize", debouncedResize);
      return () => {
        window.removeEventListener("resize", debouncedResize);
        clearTimeout(timeoutId);
      };
    },
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false, // SSR/initial value
  );

  // Track user intent for mobile menu, but derive actual state from intent + isMobile
  const [mobileMenuOpenIntent, setMobileMenuOpenIntent] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  // Derive actual mobile menu state: only open if user wants it AND we're on mobile
  const isMobileMenuOpen = isMobile && mobileMenuOpenIntent;

  // Memoize action handlers to prevent their recreation on each render
  const toggleMobileMenu = useCallback(
    () => setMobileMenuOpenIntent((prev) => !prev),
    [],
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpenIntent(false), []);

  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const toggleExpandedItem = useCallback(
    (id: string) => setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] })),
    [],
  );

  const resetExpandedItems = useCallback(() => setExpandedItems({}), []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isMobile,
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      expandedItems,
      toggleExpandedItem,
      resetExpandedItems,
    }),
    [
      isMobile,
      isMobileMenuOpen,
      isSidebarOpen,
      expandedItems,
      toggleMobileMenu,
      closeMobileMenu,
      toggleSidebar,
      closeSidebar,
      toggleExpandedItem,
      resetExpandedItems,
    ],
  );

  return (
    <MobileContext.Provider value={contextValue}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context;
}
