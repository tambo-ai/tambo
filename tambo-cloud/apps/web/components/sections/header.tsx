"use client";

import { Icons } from "@/components/icons";
import { MobileDrawer } from "@/components/mobile-drawer";
import { buttonVariants } from "@/components/ui/button";
import { easeInOutCubic } from "@/lib/animation";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export function Header({
  showDashboardButton = true,
  showLogoutButton = false,
}) {
  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur">
      <div className="flex justify-between items-center container mx-auto p-2">
        <Link
          href="/"
          title="brand-logo"
          className="relative mr-6 flex items-center space-x-2"
        >
          <Icons.logo className="w-auto" />
          <span className="font-semibold text-lg">{siteConfig.name}</span>
        </Link>
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 rounded-lg group tracking-tight font-medium"
            )}
          >
            Documentation
          </Link>
          {showDashboardButton && (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-8 text-primary-foreground rounded-lg group tracking-tight font-medium"
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
      <hr className="absolute w-full bottom-0" />
    </header>
  );
}
