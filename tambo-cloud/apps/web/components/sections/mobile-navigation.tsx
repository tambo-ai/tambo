"use client";

import { MobileDrawer } from "@/components/mobile-drawer";

interface MobileNavigationProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
}

export function MobileNavigation({
  showDashboardButton,
  showLogoutButton,
}: MobileNavigationProps) {
  return (
    <MobileDrawer
      showDashboardButton={showDashboardButton}
      showLogoutButton={showLogoutButton}
    />
  );
}
