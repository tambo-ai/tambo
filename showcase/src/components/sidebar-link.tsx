"use client";

import { type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

export const SidebarLink = memo(function SidebarLink({
  item,
  level = 0,
}: {
  item: NavigationItem;
  level?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href; // check if current pathname is equal to the link href

  return (
    <Link
      href={item.href}
      className={cn(
        "block px-3 hover:bg-accent rounded-md transition-colors",
        level === 0
          ? "py-2 text-base font-medium"
          : "py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30",
        isActive && "bg-accent/30 text-foreground", // Active link style
      )}
    >
      {item.title}
    </Link>
  );
});

SidebarLink.displayName = "SidebarLink";
