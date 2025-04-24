"use client";

import { Header } from "@/components/sections/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        showDashboardButton={false}
        showLogoutButton={true}
        transparent={false}
      />
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}
