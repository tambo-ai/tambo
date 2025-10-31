"use client";

import { type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  item: NavigationItem;
  level?: number;
}

export const SidebarLink = ({ item, level = 0 }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === item.href; // check if current pathname is equal to the link href

  return (
    <Link
      href={item.href}
      className={cn(
        "block px-3 hover:bg-accent rounded-md transition-colors flex items-center justify-between gap-2",
        level === 0
          ? "py-2 text-base font-medium"
          : "py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30",
        isActive && "bg-accent/30 text-foreground font-500", // Active link style
      )}
    >
      <span>{item.title}</span>
      {item.isNew && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
          new
        </span>
      )}
    </Link>
  );
};

SidebarLink.displayName = "SidebarLink";
