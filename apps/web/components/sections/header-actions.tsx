"use client";

import { NextAuthLogoutButton } from "@/components/auth/nextauth-logout-button";
import { buttonVariants } from "@/components/ui/button";
import { DiscordLink } from "@/components/ui/discord-link";
// import { GitHubLink } from "@/components/ui/github-link";
import { TamboChatTrigger } from "@/components/tambo-chat-trigger";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const isAuthenticated = !!session;

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
      <a
        href={process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co"}
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium",
        )}
      >
        Docs
      </a>
      <Link
        href="/#mcp"
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
      <TamboChatTrigger />
      {/* <GitHubLink href={siteConfig.links.github} text="Github" /> */}
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
          {isAuthenticated ? "Dashboard" : "Sign In"}
        </Link>
      )}
      {showLogoutButton && <NextAuthLogoutButton />}
    </div>
  );
}
