"use client";

import { TabContent } from "@/components/tab-content";
import { TabType } from "@/types/tabs";
import { useState } from "react";

export function TabbedSection() {
  const [activeTab] = useState<TabType>(TabType.MessageInterfaces);

  return (
    <div className="w-full mt-10 flex justify-center">
      <TabContent activeTab={activeTab} />
    </div>
  );
}
