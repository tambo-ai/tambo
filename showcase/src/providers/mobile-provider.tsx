"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Define a constant for the breakpoint to maintain consistency
export const MOBILE_BREAKPOINT = 768; // matches 'md' in Tailwind

type MobileContextType = {
  // Core mobile state
  isMobile: boolean;
  isMounted: boolean;

  // Navigation state
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Sidebar state (for desktop)
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  // Core state
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle window resize and initial detection - removed isMobileMenuOpen dependency
  useEffect(() => {
    setIsMounted(true);

    // Create a stable reference to the setIsMobileMenuOpen function
    // to use inside the handleResize function
    const mobileMenuSetter = setIsMobileMenuOpen;

    const handleResize = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(newIsMobile);

      // Close mobile menu when switching to desktop
      if (!newIsMobile) {
        mobileMenuSetter(false);
      }
    };

    // Check on mount
    handleResize();

    // Add event listener with debounce for better performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - this effect should only run once on mount

  // Memoize action handlers to prevent their recreation on each render
  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen((prev) => !prev),
    [],
  );

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    // Default state before hydration
    if (!isMounted) {
      return {
        isMobile: false,
        isMounted: false,
        isMobileMenuOpen: false,
        toggleMobileMenu: () => {},
        closeMobileMenu: () => {},
        isSidebarOpen: false,
        toggleSidebar: () => {},
        closeSidebar: () => {},
      };
    }

    // Actual state after hydration
    return {
      isMobile,
      isMounted,
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
    };
  }, [
    isMobile,
    isMounted,
    isMobileMenuOpen,
    isSidebarOpen,
    toggleMobileMenu,
    closeMobileMenu,
    toggleSidebar,
    closeSidebar,
  ]);

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
