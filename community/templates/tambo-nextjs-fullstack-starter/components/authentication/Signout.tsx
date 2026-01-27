"use client";
import { signOut } from "next-auth/react";

export function Signout() {
  return <button onClick={() => signOut()}>Sign out</button>;
}
