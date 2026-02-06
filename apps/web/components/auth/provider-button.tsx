"use client";

import { Icons } from "@/components/icons";
import { useSignIn } from "@/hooks/nextauth";
import { useToast } from "@/hooks/use-toast";
import { setLastUsedProvider } from "@/lib/auth-preferences";
import { setPendingLegalCookie } from "@/lib/pending-legal-cookie";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface ProviderButtonProps {
  provider: {
    id: string;
    displayName: string;
    icon: string;
  };
  routeOnSuccess?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  /** When true, sets a cookie to auto-accept legal terms after OAuth completes */
  trackLegalAcceptance?: boolean;
  /** When true, shows a "Last used" badge on the button */
  isLastUsed?: boolean;
}

export function ProviderButton({
  provider,
  routeOnSuccess = "/",
  disabled = false,
  trackLegalAcceptance = false,
  isLastUsed = false,
}: ProviderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const signIn = useSignIn();

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Track this provider as last used
      setLastUsedProvider(provider.id);

      // Set cookie to auto-accept legal terms after OAuth (only when opted in)
      if (trackLegalAcceptance) {
        setPendingLegalCookie();
      }

      await signIn(provider.id, {
        callbackUrl: routeOnSuccess,
        // TODO: when the provider is email, we need to pass the email
        // address to the callbackUrl, and probably have an input field
        // for the email address.
      });
    } catch (error) {
      console.error("Auth failed:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = Icons[provider.icon as keyof typeof Icons];

  const isDisabled = disabled || isLoading;

  return (
    <div className="relative">
      <button
        onClick={handleAuth}
        disabled={isDisabled}
        className={cn(
          "group",
          // Base styles
          "w-full h-14 px-5 relative overflow-hidden",
          "flex items-center justify-between",
          "rounded-2xl border-2",
          "font-medium text-base",
          "transition-all duration-300 ease-out",
          // Default state
          "bg-white border-border text-foreground",
          // Hover state - tambo-landing style with teal glow (only when enabled)
          "enabled:hover:bg-foreground enabled:hover:text-primary enabled:hover:border-primary",
          "enabled:hover:shadow-[0_0_24px_8px_rgba(127,255,195,0.5)]",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          // Disabled state
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Active state
          "enabled:active:scale-[0.98]",
        )}
      >
        {/* Left side - Icon and text */}
        <span className="flex items-center gap-3">
          {isLoading ? (
            <Icons.spinner className="h-5 w-5 animate-spin" />
          ) : (
            IconComponent && <IconComponent className="h-5 w-5" />
          )}
          <span>{isLoading ? "Signing in..." : provider.displayName}</span>
          {isLastUsed && (
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-primary/20 text-primary-foreground rounded-full transition-colors duration-300 group-enabled:group-hover:bg-primary/30 group-enabled:group-hover:text-primary">
              Last used
            </span>
          )}
        </span>

        {/* Right side - Arrow icon with mint background */}
        <span
          className={cn(
            "flex items-center justify-center",
            "w-8 h-8 rounded-lg",
            "bg-primary text-primary-foreground",
            "transition-transform duration-300 ease-out",
            "group-enabled:group-hover:scale-110",
          )}
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
