import Image from "next/image";
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
        <Image
          src="/discord-icon.svg"
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className="h-5 w-5"
        />
      ),
      text: "Discord",
      url: "https://tambo.co/discord",
    },
    {
      type: "icon",
      icon: (
        <Image
          src="/logo/icon/Octo-Icon.svg"
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className="h-5 w-5"
        />
      ),
      text: "Dashboard",
      url: "https://tambo.co/dashboard",
    },
  ],
  githubUrl: "https://github.com/tambo-ai/tambo",
};
