"use client";

import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";

export type DashboardCardProps = React.HTMLAttributes<HTMLDivElement>;

export const DashboardCardComponent = React.forwardRef<
  HTMLDivElement,
  DashboardCardProps
>(({ className, ...props }, ref) => {
  const handleOpenDashboard = () => {
    window.open("https://tambo.co/dashboard", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-background p-6 shadow-sm transition-all duration-200",
        className,
      )}
      {...props}
    >
      <div className="space-y-4">
        {/* Card Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/icon/Octo-Icon.svg"
              alt="Tambo"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            <h3 className="text-lg font-semibold text-foreground">
              Go to Dashboard
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access your tambo dashboard to manage your projects and settings.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleOpenDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
          >
            <span>Open Dashboard</span>
            <ExternalLinkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

DashboardCardComponent.displayName = "DashboardCard";
