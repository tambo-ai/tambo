"use client";

import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";

interface MobileDrawerProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
  showDiscordButton?: boolean;
}

export function MobileDrawer({
  showDashboardButton,
  showLogoutButton,
  showDiscordButton: _showDiscordButton = false,
}: MobileDrawerProps) {
  const { togglePanel } = useMessageThreadPanel();

  return (
    <Drawer>
      <DrawerTrigger>
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-6">
          <DrawerTitle>
            <Link
              href="/"
              title="brand-logo"
              className="relative mr-6 flex items-center space-x-2"
            >
              <Icons.logo
                className="pl-4 h-6 w-auto"
                aria-label={siteConfig.name}
              />
            </Link>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 flex flex-col gap-2">
          {showDashboardButton && (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full",
              )}
            >
              Dashboard
            </Link>
          )}
          <DrawerClose asChild>
            <Link
              href="/#pricing"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full",
              )}
            >
              Pricing
            </Link>
          </DrawerClose>
          <DrawerClose asChild>
            <Link
              href="/#mcp"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full",
              )}
            >
              MCP
            </Link>
          </DrawerClose>
          <Link
            href="/blog"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start text-base w-full",
            )}
          >
            Blog
          </Link>
          <DrawerClose asChild>
            <button
              onClick={togglePanel}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full",
              )}
            >
              Ask Tambo
            </button>
          </DrawerClose>
          {showLogoutButton && (
            <button
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full",
              )}
            >
              Logout
            </button>
          )}
        </div>
        <DrawerFooter>
          <a
            href={process.env.NEXT_PUBLIC_DOCS_URL || "/docs"}
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-white rounded-full group",
            )}
          >
            Docs
          </a>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
