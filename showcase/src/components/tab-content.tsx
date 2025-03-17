import { TabType } from "@/types/tabs";
import { ShowcaseSection } from "./showcase-section";
import { ExamplesComponent } from "./tabs/examples";
import { FormsComponent } from "./tabs/forms";
import { GraphsComponent } from "./tabs/graphs";
import { MessagesComponent } from "./tabs/messages";

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
                title: "MessageThreadFull",
                description:
                  "A full message thread component with chat history and input field.",
                installCommand: "npx tambo add message-thread-full",
                component: <div>coming soon!</div>,
              },
              {
                title: "MessageThreadCollapsible",
                description:
                  "A collapsible message thread component with chat history and input field.",
                installCommand: "npx tambo add message-thread-collapsible",
                component: <div>coming soon!</div>,
              },
              {
                title: "MessageThreadPanel",
                description:
                  "A sidebar-style message thread component with chat history and input field.",
                installCommand: "npx tambo add message-thread-panel",
                component: <div>coming soon!</div>,
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
