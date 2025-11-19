"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

interface NextAuthProviderProps {
  session: Session | null;
  children: ReactNode;
}

export function NextAuthProvider({ session, children }: NextAuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
