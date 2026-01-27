"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // "components-theme" is a utility CSS class that likely applies a global theme context or resets certain CSS variables/tokens for any child components.
    // In the Tambo starter, using a wrapper <div> with "components-theme" ensures all nested UI components (especially those shared or contextually themed) inherit the correct styling (e.g., light/dark theme, variables like --background, --foreground).
    // This pattern prevents errant styles from leaking in from the higher-level app and guarantees design consistency across all areas of the dashboard layout.
    <div className="components-theme min-h-screen bg-background text-foreground">
      {/* Navbar Header */}
      <header className="border-b border-border bg-background">
        <nav className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <Image
                src="/logo/Octo-Icon.svg"
                alt="Tambo logo"
                width={40}
                height={40}
                priority
                className="h-10 w-10"
              />
            </div>

            {/* Sign Out button on the right */}
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <DoorOpen className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
