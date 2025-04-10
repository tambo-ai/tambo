import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Client components
import { HeaderActions } from "@/components/sections/header-actions";
import { MobileNavigation } from "@/components/sections/mobile-navigation";

export function Header({
  showDashboardButton = true,
  showLogoutButton = false,
  className,
}: {
  showDashboardButton?: boolean;
  showLogoutButton?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur",
        className,
      )}
    >
      <div className="flex justify-between items-center mx-auto pt-2">
        <Link
          href="/"
          title="brand-logo"
          className="relative mr-6 flex items-center"
        >
          <Icons.logo className="h-6 w-auto" aria-label={siteConfig.name} />
        </Link>

        {/* Desktop navigation - client component */}
        <HeaderActions
          showDashboardButton={showDashboardButton}
          showLogoutButton={showLogoutButton}
        />

        {/* Mobile navigation - client component */}
        <div className="cursor-pointer block lg:hidden">
          <MobileNavigation
            showDashboardButton={showDashboardButton}
            showLogoutButton={showLogoutButton}
          />
        </div>
      </div>
      <hr className="absolute w-full bottom-0 border-border/20" />
    </header>
  );
}
