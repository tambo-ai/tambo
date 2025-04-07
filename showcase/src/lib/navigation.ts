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
