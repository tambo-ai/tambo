import { navigation, NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { SidebarLink } from "./sidebar-link";

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
      </>
    );
  }, []);

  return (
    <div
      className={cn(
        // Base styles
        "sidebar fixed top-[var(--header-height)] bottom-0 left-0 border-r border-border/40 p-4 overflow-y-auto flex flex-col bg-background z-40 w-64",
        // Hide on mobile with CSS rather than conditional rendering to prevent flash
        "max-md:hidden",
        className,
      )}
    >
      <div className="flex flex-col flex-grow">{sidebarContent}</div>
      <div className="pt-4 mt-auto border-t border-border/40">
        <p className="text-sm text-muted-foreground px-3">
          Fractal Dynamics Inc © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
