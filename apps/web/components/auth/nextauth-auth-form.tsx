"use client";
import { AuthProviderConfig } from "@/lib/auth-providers";
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
  return (
    <div className="flex flex-col items-center justify-center min-h-20 w-full px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
            Welcome to Tambo
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Get started by signing in with your preferred method
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
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No authentication providers available
            </div>
          )}
        </div>

        <AuthErrorBanner />
      </div>
    </div>
  );
}
