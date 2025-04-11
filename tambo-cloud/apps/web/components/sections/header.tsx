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
  transparent = true,
  className,
}: {
  showDashboardButton?: boolean;
  showLogoutButton?: boolean;
  transparent?: boolean;
  className?: string;
}) {
  // Set background opacity based on transparency setting
  const bgOpacity = transparent ? "bg-background/60" : "bg-background";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-[var(--header-height)] backdrop-blur",
        bgOpacity,
        className,
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-full items-center justify-between pt-2">
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
          <div className="block cursor-pointer lg:hidden">
            <MobileNavigation
              showDashboardButton={showDashboardButton}
              showLogoutButton={showLogoutButton}
            />
          </div>
        </div>
      </div>
      <hr className="absolute bottom-0 w-full border-border/20" />
    </header>
  );
}
