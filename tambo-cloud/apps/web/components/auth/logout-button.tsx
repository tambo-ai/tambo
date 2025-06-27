"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { track } from "@vercel/analytics";
import { useEffect, useState } from "react";

interface LogoutButtonProps {
  className?: string;
  mobile?: boolean;
}

export function LogoutButton({ className, mobile = false }: LogoutButtonProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Error getting session:", error);
        setIsAuthenticated(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      track("User Logout");
      window.location.href = "/";
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={`${mobile ? "justify-start text-base w-full" : "px-2"} ${className}`}
    >
      Sign Out
    </Button>
  );
}
