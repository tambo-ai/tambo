"use client";

import { type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  item: NavigationItem;
  level?: number;
  onNavigate?: () => void;
}

export const SidebarLink = ({
  item,
  level: _level = 0,
  onNavigate,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === item.href; // check if current pathname is equal to the link href

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "block px-3 py-1.5 text-sm rounded-md transition-all duration-150 flex items-center justify-between gap-2",
        "text-foreground/70 hover:text-foreground hover:bg-accent",
        isActive && "bg-accent/30 text-foreground font-medium", // Active link style
      )}
    >
      <span>{item.title}</span>
      {item.isNew && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium border border-primary/40">
          new
        </span>
      )}
    </Link>
  );
};

SidebarLink.displayName = "SidebarLink";
