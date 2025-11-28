export type NavigationItem = {
  title: string;
  href: string;
  children?: NavigationItem[];
  isNew?: boolean;
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
            title: "Elicitation",
            href: "/components/elicitation",
            isNew: true,
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
            title: "Input Fields",
            href: "/components/input-fields",
          },
          {
            title: "Graph",
            href: "/components/graph",
          },
          {
            title: "Map",
            href: "/components/map",
          },
          {
            title: "Date Time Range",
            href: "/components/date-time-range-picker",
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

export function getNavigation(pathname: string): {
  prev: { path: string; label: string } | null;
  next: { path: string; label: string } | null;
} | null {
  // Flatten all nav items into ordered array
  const allPages: Array<{ path: string; label: string; order: number }> = [];

  // Add root pages
  allPages.push({ path: "/", label: "Home", order: 0 });
  allPages.push({ path: "/get-started", label: "Get Started", order: 1 });

  // Flatten nested navigation structure
  let order = 10;
  navigation.forEach((section) => {
    if (section.children) {
      section.children.forEach((category) => {
        if (category.children) {
          category.children.forEach((page) => {
            allPages.push({
              path: page.href,
              label: page.title,
              order: order++,
            });
          });
        } else if (category.href !== "#") {
          allPages.push({
            path: category.href,
            label: category.title,
            order: order++,
          });
        }
      });
    } else if (section.href !== "#") {
      allPages.push({
        path: section.href,
        label: section.title,
        order: order++,
      });
    }
  });

  const currentIndex = allPages.findIndex((page) => page.path === pathname);
  if (currentIndex === -1) return null;

  return {
    prev: currentIndex > 0 ? allPages[currentIndex - 1] : null,
    next:
      currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null,
  };
}
