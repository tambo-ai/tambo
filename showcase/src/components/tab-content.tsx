import { TabType } from "@/types/tabs";
import { AiElementsShowcase } from "./showcase-sections/ai-elements";
import { MessagingInterfacesShowcase } from "./showcase-sections/messaging-interfaces";

interface TabContentProps {
  activeTab: TabType;
}

export function TabContent({ activeTab }: TabContentProps) {
  switch (activeTab) {
    case TabType.MessageInterfaces:
      return <MessagingInterfacesShowcase />;
    case TabType.AIGeneratedElements:
      return <AiElementsShowcase />;
    default:
      return <MessagingInterfacesShowcase />;
  }
}
