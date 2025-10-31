"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getNavigation } from "@/lib/navigation";

export function Footer() {
  const pathname = usePathname();
  const navigation = getNavigation(pathname);

  if (!navigation) return null;

  return (
    <footer className="py-6 mt-8 px-4 md:px-6">
      <div className="flex items-center justify-between text-sm">
        {navigation.prev ? (
          <Link
            href={navigation.prev.path}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{navigation.prev.label}</span>
          </Link>
        ) : (
          <div />
        )}

        {navigation.next ? (
          <Link
            href={navigation.next.path}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-all duration-200"
          >
            <span>{navigation.next.label}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </footer>
  );
}
