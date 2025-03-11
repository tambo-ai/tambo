"use client";

import { SecondNavbar } from "@/components/second-navbar";
import { TabContent } from "@/components/tab-content";
import { useState } from "react";

export function TabbedSection() {
  const [activeTab, setActiveTab] = useState("Examples");

  return (
    <>
      <SecondNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full mt-10">
        <TabContent activeTab={activeTab} />
      </div>
    </>
  );
}
