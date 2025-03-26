"use client";

import { GettingStartedSteps } from "@/components/getting-started-steps";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-background/95">
      <GettingStartedSteps />
    </div>
  );
}
