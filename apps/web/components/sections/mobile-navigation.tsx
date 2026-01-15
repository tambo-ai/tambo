"use client";

import { MobileDrawer } from "@/components/mobile-drawer";

interface MobileNavigationProps {
  showDashboardButton?: boolean;
  showDiscordButton?: boolean;
}

export function MobileNavigation({
  showDashboardButton = true,
  showDiscordButton = false,
}: MobileNavigationProps) {
  return (
    <MobileDrawer
      showDashboardButton={showDashboardButton}
      showDiscordButton={showDiscordButton}
    />
  );
}
