"use client";

import { DashboardHeader } from "@/components/sections/dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}
