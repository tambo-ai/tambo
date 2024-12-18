"use client";

import HeroVideoDialog from "@/components/ui/hero-video-dialog";
import { useSearchParams } from "next/navigation";

export default function SlackWaitlistPage() {
  const searchParams = useSearchParams();
  const companyName = searchParams.get("company");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
      {companyName ? (
        <h1 className="text-4xl font-bold text-center">
          <div>
            Welcome <span className="text-primary">{companyName}</span>!
          </div>
          <div>Build AI-Powered Slack Apps in Minutes</div>
        </h1>
      ) : (
        <h1 className="text-4xl font-bold text-center">
          Build AI-Powered Slack Apps in Minutes
        </h1>
      )}

      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          videoSrc="/videos/2024-12-17-slack-with-diferent-intro.mp4"
          animationStyle="from-bottom"
          className="w-full"
        />
      </div>

      <a
        href={`mailto:magan@usehydra.ai?subject=${encodeURIComponent(
          `I want early access${companyName ? ` - ${companyName}` : ""}`
        )}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-white shadow transition-colors hover:bg-primary/90"
      >
        Request Early Access
      </a>
    </main>
  );
}
