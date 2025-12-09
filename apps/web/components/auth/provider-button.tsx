"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/nextauth";
import { useToast } from "@/hooks/use-toast";
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
}

export function ProviderButton({
  provider,
  routeOnSuccess = "/dashboard",
  variant = "default",
}: ProviderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const signIn = useSignIn();

  const handleAuth = async () => {
    setIsLoading(true);
    try {
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
    <Button
      variant={variant}
      onClick={handleAuth}
      disabled={isLoading}
      className={cn(
        "w-full h-12 text-base font-medium active:scale-95 transition-transform",
      )}
    >
      {isLoading ? (
        <>
          <div className="flex flex-row items-center justify-center space-x-3">
            <Icons.spinner className="h-5 w-5 animate-spin" />
            <p>Loading...</p>
          </div>
        </>
      ) : (
        <>
          {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
          {provider.displayName}
        </>
      )}
    </Button>
  );
}
