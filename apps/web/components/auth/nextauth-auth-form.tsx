"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full px-4 gap-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border-2">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to Tambo
            </CardTitle>
            <CardDescription className="text-base">
              Get started by signing in with your preferred method
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="space-y-4">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <ProviderButton
                  key={provider.id}
                  provider={provider}
                  routeOnSuccess={routeOnSuccess}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No authentication providers available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AuthErrorBanner />
    </div>
  );
}
