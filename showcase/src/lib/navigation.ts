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
            title: "MessageThreadFull",
            href: "/components/message-thread-full",
          },
          {
            title: "MessageThreadCollapsible",
            href: "/components/message-thread-collapsible",
          },
          {
            title: "MessageThreadPanel",
            href: "/components/message-thread-panel",
          },
        ],
      },
      {
        title: "Generative",
        href: "#",
        children: [
          {
            title: "FormComponent",
            href: "/components/form-component",
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
