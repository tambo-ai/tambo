"use client";

import { MobileDrawer } from "@/components/mobile-drawer";

interface MobileNavigationProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
  showDiscordButton?: boolean;
}

export function MobileNavigation({
  showDashboardButton,
  showLogoutButton,
  showDiscordButton = false,
}: MobileNavigationProps) {
  return (
    <MobileDrawer
      showDashboardButton={showDashboardButton}
      showLogoutButton={showLogoutButton}
      showDiscordButton={showDiscordButton}
    />
  );
}
