import { ShowcaseSection } from "@/components/showcase-section";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { ReactElement } from "react";
import { FormChatInterface } from "./chat-interfaces/FormChatInterface";
import { GraphChatInterface } from "./chat-interfaces/GraphChatInterface";

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  renderedComponent?: ReactElement | null;
}

export const AiElementsShowcase = () => {
  return (
    <ShowcaseThemeProvider defaultTheme="light">
      <ShowcaseSection
        section={{
          title: "",
          items: [
            {
              title: "Generate Forms",
              description: "Chat with AI to generate various types of forms",
              installCommand: "npx tambo add form",
              component: <FormChatInterface />,
            },
            {
              title: "Generate Graphs",
              description: "Chat with AI to create data visualizations",
              installCommand: "npx tambo add graph",
              component: <GraphChatInterface />,
            },
          ],
        }}
      />
    </ShowcaseThemeProvider>
  );
};
