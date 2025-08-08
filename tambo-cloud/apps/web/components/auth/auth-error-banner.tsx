"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export function AuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-red-800">
            <p>Authentication failed. Please try again.</p>
            {error === "Configuration" && (
              <p className="text-sm">Server configuration error.</p>
            )}
            {error === "AccessDenied" && (
              <p className="text-sm">
                Access denied. Please check your credentials.
              </p>
            )}
            {error === "Verification" && (
              <p className="text-sm">Verification failed. Please try again.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
