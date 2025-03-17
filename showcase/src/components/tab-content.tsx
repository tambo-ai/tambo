import { TabType } from "@/types/tabs";
import { ShowcaseSection } from "./showcase-section";
import { ExamplesComponent } from "./tabs/examples";
import { FormsComponent } from "./tabs/forms";
import { GraphsComponent } from "./tabs/graphs";
import { MessagesComponent } from "./tabs/messages";
import { ThreadsComponent } from "./tabs/threads";

interface TabContentProps {
  activeTab: TabType;
}

export function TabContent({ activeTab }: TabContentProps) {
  switch (activeTab) {
    case TabType.Examples:
      return <ExamplesComponent />;
    case TabType.Messages:
      return <MessagesComponent />;
    case TabType.Threads:
      return (
        <ShowcaseSection
          section={{
            title: "Threads",
            items: [
              {
                title: "ChatThreadFull",
                description:
                  "A full chat thread component with message history and input field.",
                installCommand: "npx tambo add chat-thread-full",
                component: <ThreadsComponent />,
              },
            ],
          }}
        />
      );
    case TabType.Forms:
      return <FormsComponent />;
    case TabType.Graphs:
      return <GraphsComponent />;
    default:
      return <ExamplesComponent />;
  }
}
