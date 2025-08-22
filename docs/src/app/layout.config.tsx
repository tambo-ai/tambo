import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
  // see https://fumadocs.dev/docs/ui/navigation/links
  themeSwitch: {
    enabled: false,
  },
  links: [
    {
      type: "icon",
      icon: (
        <img
          src="/discord-icon.svg"
          alt=""
          aria-hidden="true"
          className="h-5 w-5"
        />
      ),
      text: "Discord",
      url: "https://tambo.co/discord",
    },
    {
      type: "icon",
      icon: (
        <img
          src="/logo/icon/Octo-Icon.svg"
          alt=""
          aria-hidden="true"
          className="h-5 w-5"
        />
      ),
      text: "Dashboard",
      url: "https://tambo.co/dashboard",
    },
  ],
  githubUrl: "https://github.com/tambo-ai/tambo",
};
