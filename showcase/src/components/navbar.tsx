"use client";

import { Icons } from "@/components/icons";
import { externalLinks, navigation, NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useMobile } from "@/providers/mobile-provider";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useMemo } from "react";

// Memoized link component to prevent re-renders when props don't change
const NavigationLink = memo(
  ({
    item,
    depth = 0,
    onClick,
  }: {
    item: NavigationItem;
    depth?: number;
    onClick?: () => void;
  }) => {
    return (
      <Link
        href={item.href}
        className={cn(
          "block rounded-md px-3 py-2 hover:bg-accent",
          depth === 0
            ? "text-sm"
            : "text-xs text-muted-foreground hover:text-foreground",
        )}
        onClick={onClick}
      >
        {item.title}
      </Link>
    );
  },
);
NavigationLink.displayName = "NavigationLink";

// Memoized dropdown component for expandable navigation sections
const ExpandableNavItem = memo(
  ({
    item,
    depth = 0,
    isExpanded,
    onToggle,
    children,
  }: {
    item: NavigationItem;
    depth?: number;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => {
    return (
      <div className="space-y-1">
        <button
          className={cn(
            "w-full text-left rounded-md px-3 py-2 flex items-center justify-between",
            depth === 0 ? "text-sm font-medium" : "text-xs",
            "hover:bg-accent",
          )}
          onClick={onToggle}
        >
          <span>{item.title}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {isExpanded && <div className={cn("pl-3 space-y-1")}>{children}</div>}
      </div>
    );
  },
);
ExpandableNavItem.displayName = "ExpandableNavItem";

// Memoized external link component
const ExternalLink = memo(
  ({
    link,
    onClick,
  }: {
    link: (typeof externalLinks)[number];
    onClick?: () => void;
  }) => {
    return (
      <Link
        key={link.title}
        href={link.href}
        target={link.external ? "_blank" : undefined}
        rel={link.external ? "noopener noreferrer" : undefined}
        className="rounded-md px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm"
        onClick={onClick}
      >
        {link.icon === "github" && <Icons.github className="h-4 w-4" />}
        <span>{link.title}</span>
      </Link>
    );
  },
);
ExternalLink.displayName = "ExternalLink";

export function Navbar() {
  const {
    isMobile,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    expandedItems,
    toggleExpandedItem,
  } = useMobile();

  // Memoize the navigation rendering function
  const renderMobileNavItem = useCallback(
    (item: NavigationItem, depth = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems[item.title];

      if (item.href === "#" && hasChildren) {
        return (
          <ExpandableNavItem
            key={item.title}
            item={item}
            depth={depth}
            isExpanded={isExpanded}
            onToggle={() => toggleExpandedItem(item.title)}
          >
            {item.children?.map((child) =>
              renderMobileNavItem(child, depth + 1),
            )}
          </ExpandableNavItem>
        );
      }

      return (
        <NavigationLink
          key={item.title}
          item={item}
          depth={depth}
          onClick={closeMobileMenu}
        />
      );
    },
    [expandedItems, toggleExpandedItem, closeMobileMenu],
  );

  // Memoize the navigation items to prevent unnecessary re-renders
  const mobileNavItems = useMemo(() => {
    if (!isMobile || !isMobileMenuOpen) return null;

    return (
      <>
        {navigation.map((item) => renderMobileNavItem(item))}
        <div className="h-px w-full bg-border/40 my-2" />
        {externalLinks.map((link) => (
          <ExternalLink
            key={link.title}
            link={link}
            onClick={closeMobileMenu}
          />
        ))}
      </>
    );
  }, [isMobile, isMobileMenuOpen, renderMobileNavItem, closeMobileMenu]);

  // Memoize desktop nav items
  const desktopNavItems = useMemo(() => {
    if (isMobile) return null;

    return (
      <div className="hidden md:flex items-center gap-2">
        {externalLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="rounded-md px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm border border-border/40"
          >
            {link.icon === "github" && <Icons.github className="h-4 w-4" />}
            <span>{link.title}</span>
          </Link>
        ))}
      </div>
    );
  }, [isMobile]);

  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur w-full">
      <div className="flex justify-between items-center w-full px-4 md:px-6 p-2">
        <Link href="/" title="brand-logo" className="flex items-center">
          <Icons.logo className="h-6 w-auto" aria-label="Tambo" />
        </Link>

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Desktop nav */}
        {desktopNavItems}
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border/40 shadow-md z-50 animate-in slide-in-from-top duration-200 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-2">{mobileNavItems}</div>
        </div>
      )}

      {/* Backdrop for mobile dropdown */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      <hr className="absolute w-full bottom-0 border-border/50" />
    </header>
  );
}
