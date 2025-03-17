"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderActionsProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
}

export function HeaderActions({
  showDashboardButton,
  showLogoutButton,
}: HeaderActionsProps) {
  return (
    <div className="hidden lg:flex items-center gap-6">
      <Link
        href="/blog"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Blog
      </Link>
      <Link
        href="/docs"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Documentation
      </Link>
      {showDashboardButton && (
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-9 rounded-md group tracking-tight font-medium",
          )}
        >
          Dashboard
        </Link>
      )}
      {showLogoutButton && <LogoutButton />}
    </div>
  );
}
