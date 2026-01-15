"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import { DashboardThemeProvider } from "@/providers/dashboard-theme-provider";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LegalAcceptancePage() {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const utils = api.useUtils();

  // Get return URL from query params, default to dashboard
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";

  // Check legal status when authenticated; if already accepted, redirect
  const { data: legalStatus } = api.user.hasAcceptedLegal.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && legalStatus?.accepted) {
      router.replace(returnUrl);
    }
  }, [status, legalStatus, router, returnUrl]);

  const acceptLegalMutation = api.user.acceptLegal.useMutation({
    onSuccess: async () => {
      // Optimistically update cache to avoid redirect loop
      utils.user.hasAcceptedLegal.setData(undefined, (prev) => ({
        accepted: true,
        acceptedAt: new Date(),
        version: LEGAL_CONFIG.CURRENT_VERSION,
        needsUpdate: false,
        ...(prev ?? {}),
      }));
      await utils.user.hasAcceptedLegal.invalidate();
      router.replace(returnUrl);
    },
  });

  const handleAccept = async () => {
    if (accepted) {
      await acceptLegalMutation.mutateAsync({
        version: LEGAL_CONFIG.CURRENT_VERSION,
      });
    }
  };

  return (
    <DashboardThemeProvider defaultTheme="light">
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Legal Agreement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Before you continue, please review and accept our legal
                documents.
              </p>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-legal"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                />
                <label htmlFor="accept-legal" className="text-sm">
                  I have read and accept the{" "}
                  <Link
                    className="underline"
                    href={LEGAL_CONFIG.URLS.TERMS}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Use
                  </Link>
                  ,{" "}
                  <Link
                    className="underline"
                    href={LEGAL_CONFIG.URLS.PRIVACY}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Notice
                  </Link>
                  , and{" "}
                  <Link
                    className="underline"
                    href={LEGAL_CONFIG.URLS.LICENSE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    License Agreement
                  </Link>
                  .
                </label>
              </div>

              <Button
                onClick={handleAccept}
                disabled={!accepted || acceptLegalMutation.isPending}
                className="w-full"
              >
                Accept and Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}
