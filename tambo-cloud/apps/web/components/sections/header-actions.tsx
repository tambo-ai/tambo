"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { GitHubLink } from "@/components/ui/github-link";
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
    <div className="hidden lg:flex items-center gap-x-4">
      <Link
        href="/docs"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Docs
      </Link>
      <GitHubLink href="https://github.com/tambo-ai/tambo" text="Github" />
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
