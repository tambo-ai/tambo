import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
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
  showDiscordButton = false,
}: MobileDrawerProps) {
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
          <Link
            href="/#pricing"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start text-base w-full",
            )}
          >
            Pricing
          </Link>
          <Link
            href="/#demo"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start text-base w-full",
            )}
          >
            Demo
          </Link>
          <Link
            href="/mcp"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start text-base w-full",
            )}
          >
            MCP
          </Link>
          <Link
            href="/blog"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start text-base w-full",
            )}
          >
            Blog
          </Link>
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
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-white rounded-full group",
            )}
          >
            Docs
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
