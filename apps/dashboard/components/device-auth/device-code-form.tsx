"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Device code format: 8 alphanumeric characters with optional dash (e.g., "WDJB-MJHT" or "WDJBMJHT")
const deviceCodeSchema = z.object({
  userCode: z
    .string()
    .min(1, "Please enter a device code")
    .regex(
      /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i,
      "Device code must be in format XXXX-XXXX",
    )
    .transform((val) => val.replace(/-/g, "").trim()),
});

type DeviceCodeFormValues = z.infer<typeof deviceCodeSchema>;

/**
 * Map tRPC error codes to user-friendly messages
 * Uses stable error codes instead of message strings
 */
function getErrorMessage(code: string | undefined): string {
  switch (code) {
    case "NOT_FOUND":
      return "Invalid or expired code. Please check the code and try again.";
    case "CONFLICT":
      return "This code has already been used. Please request a new code from your CLI.";
    case "BAD_REQUEST":
      return "This code has expired. Please request a new code from your CLI.";
    default:
      return "Failed to verify device code. Please try again.";
  }
}

interface DeviceCodeFormProps {
  initialCode?: string;
}

export function DeviceCodeForm({ initialCode }: DeviceCodeFormProps) {
  const form = useForm<DeviceCodeFormValues>({
    resolver: zodResolver(deviceCodeSchema),
    defaultValues: {
      userCode: initialCode ?? "",
    },
  });

  const verifyMutation = api.deviceAuth.verify.useMutation();

  const onSubmit = async (data: DeviceCodeFormValues) => {
    await verifyMutation.mutateAsync({ userCode: data.userCode });
  };

  // Success state
  if (verifyMutation.isSuccess) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 border border-green-200">
            <Check className="h-6 w-6 text-green-600" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">CLI Access Granted</h2>
            <p className="text-muted-foreground mt-1">
              You can close this window and return to your terminal.
            </p>
          </div>

          <div className="w-full rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-center text-muted-foreground">
              Your CLI will automatically detect the authorization and continue.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Enter the code displayed in your terminal
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="userCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="XXXX-XXXX"
                    {...field}
                    className="h-14 text-center text-2xl font-mono tracking-[0.3em] border-input"
                    autoComplete="off"
                    autoFocus
                    onChange={(e) => {
                      // Auto-format with dash after 4 characters
                      let value = e.target.value.replace(/[^A-Z0-9]/gi, "");
                      if (value.length > 4) {
                        value = `${value.slice(0, 4)}-${value.slice(4, 8)}`;
                      }
                      field.onChange(value);
                    }}
                    maxLength={9} // 8 chars + 1 dash
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {verifyMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">
                {getErrorMessage(verifyMutation.error.data?.code)}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              "Authorize CLI"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
