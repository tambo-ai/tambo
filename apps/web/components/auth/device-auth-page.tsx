"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { TRPCClientError } from "@trpc/client";
import { CheckCircle2, Loader2, Terminal, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type AuthState = "idle" | "submitting" | "success" | "error";

function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;
    if (code === "NOT_FOUND") {
      return "Invalid or expired code. Please check your CLI and try again.";
    }
    if (code === "BAD_REQUEST") {
      return "This code has already been used.";
    }
  }
  return "Something went wrong. Please try again.";
}

export function DeviceAuthPage() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("user_code") ?? "";

  const [userCode, setUserCode] = useState(initialCode);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";

  const verifyMutation = api.deviceAuth.verify.useMutation();

  // Format the user code as user types (add dash after 4 chars)
  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

      // Add dash after 4 characters
      if (value.length > 4) {
        value = `${value.slice(0, 4)}-${value.slice(4, 8)}`;
      }

      setUserCode(value);
      setErrorMessage(null);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!userCode || userCode.length < 9) {
        setErrorMessage("Please enter a valid 8-character code");
        return;
      }

      setAuthState("submitting");
      setErrorMessage(null);

      try {
        await verifyMutation.mutateAsync({ userCode });
        setAuthState("success");
      } catch (error) {
        setAuthState("error");
        setErrorMessage(getErrorMessage(error));
      }
    },
    [userCode, verifyMutation],
  );

  // Auto-submit if code is pre-filled and valid (only once)
  useEffect(() => {
    if (
      initialCode &&
      initialCode.length >= 8 &&
      session &&
      !isAuthLoading &&
      authState === "idle" &&
      !hasAutoSubmitted.current
    ) {
      const normalizedCode = initialCode
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (normalizedCode.length === 8) {
        hasAutoSubmitted.current = true;
        // Give a small delay to show the UI before auto-submitting
        const timer = setTimeout(() => {
          void verifyMutation
            .mutateAsync({ userCode: normalizedCode })
            .then(() => {
              setAuthState("success");
            })
            .catch((error: unknown) => {
              setAuthState("error");
              setErrorMessage(getErrorMessage(error));
            });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [initialCode, session, isAuthLoading, authState, verifyMutation]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to authorize your CLI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/login?returnUrl=/device?user_code=${userCode}`}>
                Sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authState === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>CLI Authorized</CardTitle>
            <CardDescription>
              You can now close this window and return to your terminal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Your CLI is now connected to your Tambo account. You can manage
              active CLI sessions in your settings.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Terminal className="h-8 w-8" />
          </div>
          <CardTitle>Authorize CLI</CardTitle>
          <CardDescription>
            Enter the code shown in your terminal to authorize the Tambo CLI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="XXXX-XXXX"
                value={userCode}
                onChange={handleCodeChange}
                maxLength={9}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
                disabled={authState === "submitting"}
              />
              {errorMessage && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                authState === "submitting" || !userCode || userCode.length < 9
              }
            >
              {authState === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authorizing...
                </>
              ) : (
                "Authorize"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Signing in as {session.user?.email}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
