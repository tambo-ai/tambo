"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { CreateSlackChannelSchema } from "@/lib/types/slack";
import type { CreateSlackChannelInput } from "@/lib/types/slack";
import { useState } from "react";

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
    details?: Record<string, any>;
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
            : errorData.error || "Failed to create Slack channel"
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
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setError(null);
    setInviteData(null);
    form.reset();
  };

  return (
    <Form {...form}>
      {!inviteData ? (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-[400px] space-y-4"
        >
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your company name"
                    disabled={isLoading}
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    autoCapitalize="none"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-center text-destructive">{error}</p>}

          <div className="flex justify-center">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Channel..." : "Create Slack Channel"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="w-full max-w-[400px] space-y-4">
          <p className="text-center text-muted-foreground">
            Your Slack channel &quot;{inviteData.channelName}&quot; has been
            created!
          </p>
          <div className="flex flex-col gap-4">
            {inviteData.inviteLink ? (
              <Button asChild size="lg">
                <a
                  href={inviteData.inviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  Join Slack Channel
                </a>
              </Button>
            ) : (
              <p className="text-center text-green-500">
                We sent you an invite link via email.
              </p>
            )}
            <Button variant="outline" className="w-full">
              <Link href="/docs">Check out the docs</Link>
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
