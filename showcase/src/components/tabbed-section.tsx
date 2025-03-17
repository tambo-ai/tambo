"use client";

import { SecondNavbar } from "@/components/second-navbar";
import { TabContent } from "@/components/tab-content";
import { TabType } from "@/types/tabs";
import { useState } from "react";

export function TabbedSection() {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.Examples);

  return (
    <>
      <SecondNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full mt-10">
        <TabContent activeTab={activeTab} />
      </div>
    </>
  );
}
