"use client";

import { redirect, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AuthedLayoutWrapper({
  children,
  hasSession,
}: {
  children: React.ReactNode;
  hasSession: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasSession) {
      redirect(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [hasSession, pathname]);

  return <>{children}</>;
}
