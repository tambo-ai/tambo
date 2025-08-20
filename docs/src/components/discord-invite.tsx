"use client";

import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";

// Discord Logo SVG Component
const DiscordLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.183 0 2.157 1.086 2.157 2.419.018 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.183 0 2.157 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419z" />
  </svg>
);

export type DiscordInviteProps = React.HTMLAttributes<HTMLDivElement>;

export const DiscordInvite = React.forwardRef<
  HTMLDivElement,
  DiscordInviteProps
>(({ className, ...props }, ref) => {
  const handleJoinDiscord = () => {
    window.open("https://tambo.co/discord", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-background p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2]/10">
              <DiscordLogo className="h-5 w-5 text-[#5865F2]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Join Our Discord
              </h3>
              <p className="text-sm text-muted-foreground">
                Connect with the community, get help, and stay updated
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join our Discord server to chat with other developers, get support,
            share your projects, and stay up to date with the latest tambo news.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleJoinDiscord}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3 text-sm font-medium text-white shadow hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-[#5865F2]/20 focus:ring-offset-2 transition-colors cursor-pointer w-full"
          >
            <DiscordLogo className="h-4 w-4" />
            <span>Join Discord Server</span>
            <ExternalLinkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

DiscordInvite.displayName = "DiscordInvite";
