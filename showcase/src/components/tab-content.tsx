import { TabType } from "@/types/tabs";
import { ThreadsShowcase } from "./showcase-sections/threads-showcase";
import { FormsShowcase } from "./showcase-sections/forms-showcase";
import { GraphsShowcase } from "./showcase-sections/graphs-showcase";

interface TabContentProps {
  activeTab: TabType;
}

export function TabContent({ activeTab }: TabContentProps) {
  switch (activeTab) {
    case TabType.Threads:
      return <ThreadsShowcase />;
    case TabType.Forms:
      return <FormsShowcase />;
    case TabType.Graphs:
      return <GraphsShowcase />;
    default:
      return <ThreadsShowcase />;
  }
}
