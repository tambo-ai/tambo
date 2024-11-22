"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { track } from "@vercel/analytics";
import { useEffect, useState } from "react";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  mobile?: boolean;
}

export function LogoutButton({ variant = "ghost", className, mobile = false }: LogoutButtonProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      track("User Logout");
      window.location.href = window.location.href;
    } catch (error) {
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
      variant={variant}
      className={`${mobile ? 'justify-start text-base w-full' : 'text-xs px-2'} ${className}`}
    >
      logout
    </Button>
  );
} 