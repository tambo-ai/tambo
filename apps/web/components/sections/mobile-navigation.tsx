"use client";

import { MobileDrawer } from "@/components/mobile-drawer";
import { useEffect, useState } from "react";

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <MobileDrawer
      showDashboardButton={showDashboardButton}
      showLogoutButton={showLogoutButton}
      showDiscordButton={showDiscordButton}
    />
  );
}
