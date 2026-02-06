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
  routeOnSuccess = "/",
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
      <div className="w-full max-w-md mx-auto space-y-10">
        {/* Header section with Sentient font */}
        <div className="text-center space-y-4">
          <h1 className="font-sentient text-4xl md:text-5xl font-light tracking-tight text-foreground">
            {isReturningUser ? "Welcome back" : "Welcome to Tambo"}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg font-normal">
            {isReturningUser
              ? "Sign in to continue"
              : "Get started by signing in with your preferred method"}
          </p>
        </div>

        {/* Provider buttons */}
        <div className="space-y-3">
          {providers.length > 0 ? (
            providers.map((provider) => (
              <ProviderButton
                key={provider.id}
                provider={provider}
                routeOnSuccess={routeOnSuccess}
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

        {/* Legal acceptance checkbox */}
        {!isReturningUser && (
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="accept-legal"
              checked={legalAccepted}
              onCheckedChange={(v) => setLegalAccepted(v === true)}
              className="mt-1 shrink-0 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="accept-legal"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              I have read and accept the{" "}
              <Link
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                href={LEGAL_CONFIG.URLS.TERMS}
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Use
              </Link>
              ,{" "}
              <Link
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                href={LEGAL_CONFIG.URLS.PRIVACY}
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Notice
              </Link>
              , and{" "}
              <Link
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
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
