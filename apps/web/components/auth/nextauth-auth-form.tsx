"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getLastUsedProvider,
  hasAcceptedLegalBefore,
} from "@/lib/auth-preferences";
import { AuthProviderConfig } from "@/lib/auth-providers";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import { AuthErrorBanner } from "./auth-error-banner";
import { ProviderButton } from "./provider-button";

interface AuthFormProps {
  routeOnSuccess?: string;
  providers: AuthProviderConfig[];
}

export function NextAuthAuthForm({
  routeOnSuccess = "/dashboard",
  providers,
}: AuthFormProps) {
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [lastUsedProvider, setLastUsedProvider] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Check for returning user on mount
  useEffect(() => {
    const lastProvider = getLastUsedProvider();
    const hasAccepted = hasAcceptedLegalBefore();

    setLastUsedProvider(lastProvider);
    setIsReturningUser(hasAccepted);

    // Auto-accept legal for returning users
    if (hasAccepted) {
      setLegalAccepted(true);
    }
  }, []);

  // For returning users, we still track legal acceptance but don't require the checkbox
  const isButtonDisabled = isReturningUser ? false : !legalAccepted;

  return (
    <div className="flex flex-col items-center justify-center min-h-20 w-full px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
            {isReturningUser ? "Welcome back" : "Welcome to Tambo"}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {isReturningUser
              ? "Sign in to continue"
              : "Get started by signing in with your preferred method"}
          </p>
        </div>

        <div className="space-y-3">
          {providers.length > 0 ? (
            providers.map((provider, index) => (
              <ProviderButton
                key={provider.id}
                provider={provider}
                routeOnSuccess={routeOnSuccess}
                variant={index === 0 ? "default" : "outline"}
                disabled={isButtonDisabled}
                trackLegalAcceptance={!isReturningUser}
                isLastUsed={lastUsedProvider === provider.id}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No authentication providers available
            </div>
          )}
        </div>

        {!isReturningUser && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-legal"
              checked={legalAccepted}
              onCheckedChange={(v) => setLegalAccepted(v === true)}
            />
            <label
              htmlFor="accept-legal"
              className="text-sm text-muted-foreground"
            >
              I have read and accept the{" "}
              <Link
                className="underline hover:text-foreground"
                href={LEGAL_CONFIG.URLS.TERMS}
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Use
              </Link>
              ,{" "}
              <Link
                className="underline hover:text-foreground"
                href={LEGAL_CONFIG.URLS.PRIVACY}
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Notice
              </Link>
              , and{" "}
              <Link
                className="underline hover:text-foreground"
                href={LEGAL_CONFIG.URLS.LICENSE}
                target="_blank"
                rel="noopener noreferrer"
              >
                License Agreement
              </Link>
              .
            </label>
          </div>
        )}

        <AuthErrorBanner />
      </div>
    </div>
  );
}
