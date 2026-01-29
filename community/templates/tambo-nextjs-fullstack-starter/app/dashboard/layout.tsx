"use client";

import { Button } from "@/components/ui/button";
import { DoorOpen } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-heading">
      {/* Navbar Header */}
      <header className="border-b border-border bg-background">
        <nav className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center">
              <Image
                src="/logo/wordmark/Tambo-Lockup.svg"
                alt="Tambo logo"
                width={56}
                height={56}
                priority
                className="h-31 w-31"
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
