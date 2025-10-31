"use client";

import { navigation, NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { SidebarLink } from "./sidebar-link";
import { useMobile } from "@/providers/mobile-provider";

interface SidebarProps {
  className?: string;
}

// Memoized navigation section component
const NavSection = memo(
  ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    // Skip rendering parent items with children if they're just categories
    if (item.href === "#" && item.children) {
      return (
        <div className="space-y-3">
          {level === 0 && (
            <h3 className="px-3 text-sm font-bold text-muted-foreground tracking-wider">
              {item.title}
            </h3>
          )}
          <div className={cn("space-y-2", level > 0 && "pl-2")}>
            {item.children.map((child) => {
              if (child.href === "#" && child.children) {
                return (
                  <div key={child.title} className="space-y-1">
                    <h4 className="px-3 text-sm font-semibold text-muted-foreground tracking-wider">
                      {child.title}
                    </h4>
                    {child.children.map((grandchild) => (
                      <NavSection
                        key={grandchild.title}
                        item={grandchild}
                        level={level + 2}
                      />
                    ))}
                  </div>
                );
              }

              return (
                <SidebarLink key={child.title} item={child} level={level + 1} />
              );
            })}
          </div>
        </div>
      );
    }

    return <SidebarLink item={item} level={level} />;
  },
);
NavSection.displayName = "NavSection";

export function Sidebar({ className }: SidebarProps) {
  const { isMobile, isMobileMenuOpen, closeMobileMenu } = useMobile();

  // Memoize the sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    // First find the "Home" and "Get Started" top-level items
    const homeAndGetStarted = navigation.filter(
      (item) => item.href === "/" || item.href === "/get-started",
    );

    // Then get the remaining navigation items
    const otherNavItems = navigation.filter(
      (item) => item.href !== "/" && item.href !== "/get-started",
    );

    return (
      <>
        <div className="flex flex-col flex-grow">
          <nav className="flex flex-col space-y-6">
            {/* Render "Home" and "Get Started" with reduced spacing */}
            <div className="space-y-0.5">
              {homeAndGetStarted.map((item) => (
                <NavSection key={item.title} item={item} />
              ))}
            </div>

            {/* Render other navigation items */}
            {otherNavItems.map((item) => (
              <NavSection key={item.title} item={item} />
            ))}
          </nav>
        </div>
        <div className="pt-4 mt-auto border-t border-border/40">
          <p className="text-sm text-muted-foreground px-3">
            Fractal Dynamics Inc © {new Date().getFullYear()}
          </p>
        </div>
      </>
    );
  }, []);

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Single sidebar that adapts to mobile/desktop with CSS */}
      <aside
        className={cn(
          // Base positioning and size
          "fixed top-[var(--header-height)] bottom-0 left-0 w-64 z-40",
          // Background and borders
          "bg-background border-r border-border/40",
          // Content layout
          "p-4 overflow-y-auto flex flex-col",
          // Mobile: transform off-screen by default, slide in when open
          "transform transition-transform duration-200",
          isMobile && !isMobileMenuOpen && "-translate-x-full",
          // Desktop: always visible, no transform
          "md:translate-x-0",
          className,
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
