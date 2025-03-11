"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { Icons } from "@/components/icons";
import { MobileDrawer } from "@/components/mobile-drawer";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Header({
  showDashboardButton = true,
  showLogoutButton = false,
}: {
  showDashboardButton?: boolean;
  showLogoutButton?: boolean;
}) {
  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur">
      <div className="flex justify-between items-center container mx-auto p-2">
        <Link
          href="/"
          title="brand-logo"
          className="relative mr-6 flex items-center"
        >
          <div className="flex items-center justify-center w-8 h-8">
            <Icons.logo className="w-8 h-8" />
          </div>
          <Image
            src="/assets/landing/wordmark-placeholder.png"
            alt={siteConfig.name}
            width={160}
            height={50}
            className="h-10 w-auto"
          />
        </Link>
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
        <div className="mt-2 cursor-pointer block lg:hidden">
          <MobileDrawer
            showDashboardButton={showDashboardButton}
            showLogoutButton={showLogoutButton}
          />
        </div>
      </div>
      <hr className="absolute w-full bottom-0 border-border/20" />
    </header>
  );
}
