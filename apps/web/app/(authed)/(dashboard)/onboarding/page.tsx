"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { REFERRAL_SOURCES, type ReferralSource } from "@tambo-ai-cloud/core";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const [referralSource, setReferralSource] = useState<ReferralSource | "">("");
  const router = useRouter();
  const utils = api.useUtils();
  const saveReferralMutation = api.user.saveReferralSource.useMutation();
  const completeOnboardingMutation = api.user.completeOnboarding.useMutation();

  // If already completed onboarding, redirect to dashboard
  const { data: hasCompleted, isLoading } =
    api.user.hasCompletedOnboarding.useQuery();

  useEffect(() => {
    if (!isLoading && hasCompleted) {
      router.replace("/");
    }
  }, [hasCompleted, isLoading, router]);

  const handleGetStarted = async () => {
    try {
      if (referralSource) {
        await saveReferralMutation.mutateAsync({ source: referralSource });
      }

      await completeOnboardingMutation.mutateAsync();
      // Invalidate to trigger fresh fetch
      await utils.user.hasCompletedOnboarding.invalidate();
      router.push("/");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Error already handled by mutation error states
    }
  };

  if (isLoading || hasCompleted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-10"
      >
        <div className="flex justify-center">
          <Image
            src="/logo/icon/Octo-Icon.svg"
            alt="Tambo Logo"
            width={56}
            height={56}
            priority
          />
        </div>

        <div className="text-center space-y-3">
          <h1 className="font-sentient text-4xl md:text-5xl font-light tracking-tight text-card-foreground">
            Welcome to Tambo
          </h1>
          <p className="text-muted-foreground text-base">
            One quick question before we get you set up.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-foreground">
            How did you hear about us?{" "}
            <span className="text-muted-foreground">(optional)</span>
          </p>
          <RadioGroup
            value={referralSource}
            onValueChange={(value) =>
              setReferralSource(value as ReferralSource)
            }
            className="grid grid-cols-2 gap-2"
          >
            {REFERRAL_SOURCES.map((source, i) => {
              const id = `referral-source-${i}`;
              return (
                <label
                  key={source}
                  htmlFor={id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors",
                    referralSource === source
                      ? "border-primary/40 bg-primary/5 text-card-foreground"
                      : "border-border hover:border-primary/30 text-card-foreground",
                  )}
                >
                  <RadioGroupItem value={source} id={id} className="shrink-0" />
                  {source}
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <Button
          onClick={handleGetStarted}
          className="w-full"
          size="lg"
          disabled={completeOnboardingMutation.isPending}
        >
          {completeOnboardingMutation.isPending
            ? "Setting up..."
            : "Get Started"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
