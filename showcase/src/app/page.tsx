"use client";

import { SecondNavbar } from "@/components/second-navbar";
import { TabContent } from "@/components/tab-content";
import { TabType } from "@/types/tabs";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.Threads);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-background/95 -mt-20">
      <div className="text-center py-24 md:py-32 px-4 max-w-4xl">
        <h1 className="font-sentient text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/70 mb-6">
          Components to quickstart your AI app development
        </h1>
        <p className="font-sentient text-lg md:text-xl text-muted-foreground/90 max-w-[700px] mx-auto leading-relaxed">
          A collection of ready-to-use AI components hooked up to Tambo.
        </p>
      </div>
      <div className="-mt-20">
        <SecondNavbar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      </div>
      <TabContent activeTab={activeTab} />
    </div>
  );
}
