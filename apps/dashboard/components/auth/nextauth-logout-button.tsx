"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/nextauth";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function NextAuthLogoutButton({
  variant = "outline",
  size = "default",
  className = "",
  children,
}: LogoutButtonProps) {
  const signOut = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {children || "Sign Out"}
    </Button>
  );
}
