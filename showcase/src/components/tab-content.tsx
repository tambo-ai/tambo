import { TabType } from "@/types/tabs";
import { ThreadsShowcase } from "./showcase-sections/threads-showcase";
import { FormsComponent } from "./tabs/forms";
import { GraphsComponent } from "./tabs/graphs";
import { MessagesComponent } from "./tabs/messages";

interface TabContentProps {
  activeTab: TabType;
}

export function TabContent({ activeTab }: TabContentProps) {
  switch (activeTab) {
    case TabType.Messages:
      return <MessagesComponent />;
    case TabType.Threads:
      return <ThreadsShowcase />;
    case TabType.Forms:
      return <FormsComponent />;
    case TabType.Graphs:
      return <GraphsComponent />;
    default:
      return <ThreadsShowcase />;
  }
}
