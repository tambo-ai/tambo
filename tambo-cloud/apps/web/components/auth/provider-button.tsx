"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/nextauth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProviderButtonProps {
  provider: {
    id: string;
    displayName: string;
    icon: string;
  };
  routeOnSuccess?: string;
}

export function ProviderButton({
  provider,
  routeOnSuccess = "/dashboard",
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
      variant="outline"
      onClick={handleAuth}
      disabled={isLoading}
      className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
    >
      {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
      {provider.displayName}
    </Button>
  );
}
