export type NavigationItem = {
  title: string;
  href: string;
  children?: NavigationItem[];
};

export const navigation: NavigationItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Get Started",
    href: "/get-started",
  },
  {
    title: "Components",
    href: "#",
    children: [
      {
        title: "Blocks",
        href: "#",
        children: [
          {
            title: "Message Thread Full",
            href: "/components/message-thread-full",
          },
          {
            title: "Message Thread Collapsible",
            href: "/components/message-thread-collapsible",
          },
          {
            title: "Message Thread Panel",
            href: "/components/message-thread-panel",
          },
          {
            title: "Control Bar",
            href: "/components/control-bar",
          },
        ],
      },
      {
        title: "Message Primitives",
        href: "#",
        children: [
          {
            title: "Message",
            href: "/components/message",
          },
          {
            title: "Message Input",
            href: "/components/message-input",
          },
          {
            title: "Thread Content",
            href: "/components/thread-content",
          },
          {
            title: "Thread History",
            href: "/components/thread-history",
          },
        ],
      },
      {
        title: "Generative",
        href: "#",
        children: [
          {
            title: "Form",
            href: "/components/form",
          },
          {
            title: "Graph",
            href: "/components/graph",
          },
          {
            title: "Map",
            href: "/components/map",
          },
        ],
      },
      {
        title: "Canvas",
        href: "#",
        children: [
          {
            title: "Canvas Space",
            href: "/components/canvas-space",
          },
        ],
      },
    ],
  },
];

export const externalLinks = [
  {
    title: "Source Code",
    href: "https://github.com/tambo-ai/tambo",
    icon: "github",
    external: true,
  },
];
