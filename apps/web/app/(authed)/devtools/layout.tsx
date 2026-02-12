"use client";

import { DashboardThemeProvider } from "@/providers/dashboard-theme-provider";

interface DevtoolsLayoutProps {
  children: React.ReactNode;
}

export default function DevtoolsLayout({ children }: DevtoolsLayoutProps) {
  return (
    <DashboardThemeProvider defaultTheme="light">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto px-4 py-6 md:px-6">{children}</div>
      </div>
    </DashboardThemeProvider>
  );
}
