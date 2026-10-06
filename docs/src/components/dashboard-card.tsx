"use client";

import { SELF_HOSTING_URL, SHUTDOWN_ANNOUNCEMENT_URL } from "@/lib/shutdown";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";

export type DashboardCardProps = React.HTMLAttributes<HTMLDivElement>;

const linkBaseClassName =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

/**
 * Shown when a docs visitor asks for the Tambo dashboard. Tambo Cloud is
 * shutting down, so instead of opening the console it points to the shutdown
 * announcement and the self-hosting guide.
 * @returns The dashboard card element.
 */
export const DashboardCardComponent = React.forwardRef<
  HTMLDivElement,
  DashboardCardProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-sm transition-all duration-200",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo/icon/Octo-Icon.svg"
            alt="Tambo"
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <h3 className="text-lg font-semibold text-foreground">
            Tambo Cloud is shutting down
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          New signups are closed, and the hosted API stops responding after
          October 31, 2026. Tambo is open source, so you can self-host it and
          run your own dashboard.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <a
          href={SHUTDOWN_ANNOUNCEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            linkBaseClassName,
            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          )}
        >
          <span>Read the announcement</span>
          <ExternalLinkIcon aria-hidden="true" className="h-4 w-4" />
        </a>
        <a
          href={SELF_HOSTING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            linkBaseClassName,
            "border border-border text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <span>Self-host Tambo</span>
          <ExternalLinkIcon aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
});

DashboardCardComponent.displayName = "DashboardCard";
