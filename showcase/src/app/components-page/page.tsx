"use client";

import { SecondNavbar } from "@/components/second-navbar";
import { TabContent } from "@/components/tab-content";
import { TabType } from "@/types/tabs";
import { useState } from "react";

export default function ComponentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>(
    TabType.MessageInterfaces,
  );

  return (
    <main className="min-h-screen">
      <div className="container mx-auto flex flex-col gap-8">
        <h1 className="font-sentient text-4xl font-bold ml-4">
          Ready-to-use components
        </h1>
        <SecondNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="ml-4"
        />
        <TabContent activeTab={activeTab} />
      </div>
    </main>
  );
}
