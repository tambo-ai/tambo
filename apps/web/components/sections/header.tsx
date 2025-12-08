import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
// Whitelabel badge (client component)
import { WhitelabelBadge } from "@/components/whitelabel-badge";
import Link from "next/link";

// Client components
import { HeaderActions } from "@/components/sections/header-actions";
import { MobileNavigation } from "@/components/sections/mobile-navigation";

export function Header({
  showDashboardButton = true,
  showLogoutButton = false,
  showDiscordButton = false,
  transparent = true,
  className,
}: {
  showDashboardButton?: boolean;
  showLogoutButton?: boolean;
  showDiscordButton?: boolean;
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
      )}
    >
      <div className={cn("mx-auto w-full max-w-7xl", className)}>
        <div className="flex h-full items-center justify-between pt-2">
          <Link
            href="/"
            title="brand-logo"
            className="relative mr-6 flex items-center"
          >
            <Icons.logo className="h-6 w-auto" aria-label={siteConfig.name} />

            {/* Partner whitelabel badge */}
            <WhitelabelBadge />
          </Link>

          {/* Desktop navigation - client component */}
          <HeaderActions
            showDashboardButton={showDashboardButton}
            showLogoutButton={showLogoutButton}
            showDiscordButton={showDiscordButton}
          />

          {/* Mobile navigation - client component */}
          <div className="block cursor-pointer lg:hidden">
            <MobileNavigation
              showDashboardButton={showDashboardButton}
              showLogoutButton={showLogoutButton}
              showDiscordButton={showDiscordButton}
            />
          </div>
        </div>
      </div>
      <hr className="absolute bottom-0 w-full border-border/20" />
    </header>
  );
}
