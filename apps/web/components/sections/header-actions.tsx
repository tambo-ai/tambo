"use client";

import { TamboChatTrigger } from "@/components/tambo-chat-trigger";
import { buttonVariants } from "@/components/ui/button";
import { DiscordLink } from "@/components/ui/discord-link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderActionsProps {
  showDashboardButton?: boolean;
  showDiscordButton?: boolean;
}

export function HeaderActions({
  showDashboardButton = true,
  showDiscordButton = true,
}: HeaderActionsProps) {
  // Dashboard URL - redirects are configured in next.config.mjs
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.tambo.co";

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
      {showDiscordButton && (
        <DiscordLink href={siteConfig.links.discord} text="Discord" />
      )}
      {showDashboardButton && (
        <a
          href={dashboardUrl}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-9 rounded-md group tracking-tight font-medium",
          )}
        >
          Sign In
        </a>
      )}
    </div>
  );
}
