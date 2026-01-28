"use client";

import {
  MusicWidget,
  StatsWidget,
  TasksWidget,
  WeatherWidget,
} from "@/components/tambo/widgets";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { useTambo } from "@tambo-ai/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { thread } = useTambo();

  // Get the latest component rendered by the AI, if any
  const latestComponent =
    thread?.messages[thread.messages.length - 1]?.renderedComponent;

  // Default Bento Grid (The "Personal OS" look)
  const DefaultDashboard = (
    <BentoGrid>
      {/* Weather Widget */}
      <BentoGridItem
        title="Tokyo, JP"
        description="Current Location"
        header={
          <div className="h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
            <WeatherWidget city="Tokyo" temperature={24} condition="Cloudy" />
          </div>
        }
        className="md:col-span-1"
      />

      {/* Tasks Widget (Meta Checklist) */}
      <BentoGridItem
        title="System Status"
        description="Setup Checklist"
        header={
          <div className="h-full min-h-[6rem] rounded-xl border border-neutral-200 dark:border-white/[0.2] bg-white dark:bg-black p-2">
            <TasksWidget
              title="Getting Started"
              tasks={[
                { id: "1", label: "Clone Template", completed: true },
                { id: "2", label: "Install Deps", completed: true },
                { id: "3", label: "Connect Tambo API", completed: true },
                { id: "4", label: "Customize Widgets", completed: false },
              ]}
            />
          </div>
        }
        className="md:col-span-1"
      />

      {/* Music Widget */}
      <BentoGridItem
        title="Now Playing"
        description="Spotify"
        header={
          <div className="h-full min-h-[6rem]">
            <MusicWidget song="Midnight City" artist="M83" />
          </div>
        }
        className="md:col-span-1"
      />

      {/* Stats Widgets */}
      <BentoGridItem
        title="Revenue"
        description="Monthly Recurring"
        header={
          <StatsWidget
            label="MRR"
            value="$12,450"
            trend="+12%"
            trendUp={true}
          />
        }
        className="md:col-span-1"
      />
      <BentoGridItem
        title="Visitors"
        description="Last 30 Days"
        header={
          <StatsWidget
            label="Unique Visitors"
            value="45.2k"
            trend="-2%"
            trendUp={false}
          />
        }
        className="md:col-span-1"
      />
    </BentoGrid>
  );

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/Octo-Icon.svg"
            alt="Tambo Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            Personal OS
          </h1>
        </div>
        <Link
          href="/chat"
          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:opacity-90 transition"
        >
          Ask AI to Customize →
        </Link>
      </div>

      {latestComponent ? (
        <div className="animate-in fade-in duration-500">{latestComponent}</div>
      ) : (
        DefaultDashboard
      )}
    </main>
  );
}
