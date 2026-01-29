"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/nextauth";
import { useToast } from "@/hooks/use-toast";
import { setLastUsedProvider } from "@/lib/auth-preferences";
import { setPendingLegalCookie } from "@/lib/pending-legal-cookie";
import { cn } from "@/lib/utils";
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
  routeOnSuccess = "/dashboard",
  variant = "default",
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

  return (
    <div className="relative">
      {isLastUsed && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 z-10 text-xs"
        >
          Last used
        </Badge>
      )}
      <Button
        variant={variant}
        onClick={handleAuth}
        disabled={disabled || isLoading}
        className={cn(
          "w-full h-12 text-base font-medium active:scale-95 transition-transform",
        )}
      >
        {isLoading ? (
          <div className="flex flex-row items-center justify-center space-x-3">
            <Icons.spinner className="h-5 w-5 animate-spin" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
            {provider.displayName}
          </>
        )}
      </Button>
    </div>
  );
}
