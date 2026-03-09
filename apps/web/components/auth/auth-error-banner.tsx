"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export function AuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error) {
    const isSessionExpired = error === "SessionExpired";
    return (
      <Card
        className={`w-full max-w-md mx-auto ${isSessionExpired ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}
      >
        <CardContent className="pt-6">
          <div
            className={`space-y-2 ${isSessionExpired ? "text-amber-800" : "text-red-800"}`}
          >
            {isSessionExpired ? (
              <p>Your session has expired. Please sign in again to continue.</p>
            ) : (
              <>
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
                  <p className="text-sm">
                    Verification failed. Please try again.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
