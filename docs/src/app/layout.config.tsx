import { SHUTDOWN_ANNOUNCEMENT_URL } from "@/lib/shutdown";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Megaphone } from "lucide-react";

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
      icon: <Megaphone aria-hidden="true" className="h-5 w-5" />,
      text: "Shutdown notice",
      url: SHUTDOWN_ANNOUNCEMENT_URL,
    },
  ],
  githubUrl: "https://github.com/tambo-ai/tambo",
};
