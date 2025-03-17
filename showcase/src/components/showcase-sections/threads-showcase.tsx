import { ShowcaseSection } from "../showcase-section";

export const ThreadsShowcase = () => {
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
};
