"use client";

import { NextAuthLogoutButton } from "@/components/auth/nextauth-logout-button";
import { buttonVariants } from "@/components/ui/button";
import { DiscordLink } from "@/components/ui/discord-link";
import { GitHubLink } from "@/components/ui/github-link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderActionsProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
  showDiscordButton?: boolean;
}

export function HeaderActions({
  showDashboardButton,
  showLogoutButton,
  showDiscordButton = true,
}: HeaderActionsProps) {
  return (
    <div className="hidden lg:flex items-center gap-x-4">
      <Link
        href="/#pricing"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Pricing
      </Link>
      <Link
        href="/#demo"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Demo
      </Link>
      <Link
        href={process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co"}
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Docs
      </Link>
      <Link
        href="/mcp"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        MCP
      </Link>
      <Link
        href="/blog"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Blog
      </Link>
      <GitHubLink href={siteConfig.links.github} text="Github" />
      {showDiscordButton && (
        <DiscordLink href={siteConfig.links.discord} text="Discord" />
      )}
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
      {showLogoutButton && <NextAuthLogoutButton />}
    </div>
  );
}
