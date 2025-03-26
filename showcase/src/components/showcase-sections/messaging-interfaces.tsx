import { MessageThreadCollapsible } from "@/components/ui/message-thread-collapsible";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { MessageThreadPanel } from "@/components/ui/message-thread-panel";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { ShowcaseSection } from "../showcase-section";

export const MessagingInterfacesShowcase = () => {
  return (
    <ShowcaseThemeProvider defaultTheme="light">
      <ShowcaseSection
        section={{
          title: "",
          items: [
            {
              title: "MessageThreadFull",
              description:
                "A full message thread component with chat history and input field.",
              installCommand: "npx tambo add message-thread-full",
              component: <MessageThreadFull />,
            },
            {
              title: "MessageThreadCollapsible",
              description:
                "A collapsible message thread component with chat history and input field.",
              installCommand: "npx tambo add message-thread-collapsible",
              component: <MessageThreadCollapsible defaultOpen={true} />,
            },
            {
              title: "MessageThreadPanel",
              description:
                "A sidebar-style message thread component with chat history and input field.",
              installCommand: "npx tambo add message-thread-panel",
              component: (
                <div className="h-[600px] relative flex">
                  <div className="flex-1 bg-muted/20 flex flex-col gap-4 p-6">
                    <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
                    <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
                    <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="h-32 bg-muted/80 rounded-lg" />
                      <div className="h-32 bg-muted/80 rounded-lg" />
                    </div>
                  </div>
                  <MessageThreadPanel className="w-[400px] relative" />
                </div>
              ),
            },
          ],
        }}
      />
    </ShowcaseThemeProvider>
  );
};
