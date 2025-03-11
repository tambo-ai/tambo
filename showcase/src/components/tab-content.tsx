"use client";

import { ExamplesComponent } from "./tabs/examples";
import { MessagesComponent } from "./tabs/messages";
import { ThreadsComponent } from "./tabs/threads";
import { FormsComponent } from "./tabs/forms";
import { GraphsComponent } from "./tabs/graphs";

interface TabContentProps {
  activeTab: string;
}

export function TabContent({ activeTab }: TabContentProps) {
  switch (activeTab.toLowerCase()) {
    case "examples":
      return <ExamplesComponent />;
    case "messages":
      return <MessagesComponent />;
    case "threads":
      return <ThreadsComponent />;
    case "forms":
      return <FormsComponent />;
    case "graphs":
      return <GraphsComponent />;
    default:
      return <ExamplesComponent />;
  }
}
