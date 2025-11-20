"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateSlackChannelInput } from "@/lib/types/slack";
import { CreateSlackChannelSchema } from "@/lib/types/slack";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface SlackChannelFormProps {
  onSuccess?: (data: {
    channelId: string;
    channelName: string;
    inviteLink: string;
  }) => void;
}

export function SlackChannelForm({ onSuccess }: SlackChannelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    channelId: string;
    channelName: string;
    inviteLink: string;
  } | null>(null);

  const form = useForm<CreateSlackChannelInput>({
    resolver: zodResolver(CreateSlackChannelSchema),
    defaultValues: {
      companyName: "",
      email: "",
    },
  });

  interface APIError {
    error: string;
    details?: Record<string, unknown>;
  }

  async function onSubmit(values: CreateSlackChannelInput) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/slack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as APIError;
        throw new Error(
          errorData.details
            ? `${errorData.error}: ${JSON.stringify(errorData.details)}`
            : errorData.error || "Failed to create Slack channel",
        );
      }

      if (!data.data?.channelId || !data.data?.channelName) {
        throw new Error("Invalid response from server");
      }

      const inviteData = {
        channelId: data.data.channelId,
        channelName: data.data.channelName,
        inviteLink: data.data.inviteLink,
      };

      setInviteData(inviteData);
      onSuccess?.(inviteData);
    } catch (err) {
      console.error("Slack channel creation error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        {!inviteData ? (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Company Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company name"
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      autoCapitalize="none"
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <span className="mr-2">Creating Channel</span>
                  <span className="animate-pulse">...</span>
                </>
              ) : (
                "Create Slack Channel"
              )}
            </Button>
          </form>
        ) : (
          <div className="w-full space-y-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Channel Created!</h3>
            </div>

            <div className="space-y-4">
              {inviteData.inviteLink ? (
                <Button asChild size="lg" className="w-full">
                  <Link
                    href={inviteData.inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join &quot;{inviteData.channelName}&quot; Slack Channel
                  </Link>
                </Button>
              ) : (
                <>
                  <p className="text-sm text-green-600 font-medium">
                    We sent you an invite to &quot;{inviteData.channelName}
                    &quot;
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild>
                      <Link
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        Gmail
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link
                        href="https://outlook.live.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        Outlook
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Form>
  );
}
