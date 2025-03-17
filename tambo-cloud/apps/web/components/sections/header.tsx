import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import Link from "next/link";

// Client components
import { HeaderActions } from "@/components/sections/header-actions";
import { MobileNavigation } from "@/components/sections/mobile-navigation";

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
          <Icons.logo className="h-6 w-auto" aria-label={siteConfig.name} />
        </Link>

        {/* Desktop navigation - client component */}
        <HeaderActions
          showDashboardButton={showDashboardButton}
          showLogoutButton={showLogoutButton}
        />

        {/* Mobile navigation - client component */}
        <div className="mt-2 cursor-pointer block lg:hidden">
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
