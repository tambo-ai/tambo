import { Icons } from "@/components/icons";
import { env } from "@/lib/env";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "tambo",
  description: "Build AI-powered apps in just one line of code.",
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "AI UI Generation",
    "React Components",
    "Adaptive Interfaces",
    "UI Automation",
  ],
  links: {
    email: "support@tambo.co",
    twitter: "https://x.com/tambo_ai",
    discord: "https://discord.gg/dJNvPEHth6",
    github: "https://github.com/tambo-ai/tambo",
  },
  metadata: {
    title: "Build AI-powered apps in just one line of code | tambo",
    description:
      "tambo is an AI-powered router that surfaces the right features to users based on context. Build adaptive UIs for your web app with ease.",
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: "Build AI-powered apps in just one line of code | tambo",
      description:
        "tambo is an AI-powered router that surfaces the right features to users based on context",
    },
    twitter: {
      card: "summary_large_image",
      title: "Build AI-powered apps in just one line of code | tambo",
      description:
        "tambo is an AI-powered router that surfaces the right features to users based on context",
    },
  },
  footer: {
    socialLinks: [
      {
        icon: <Icons.github className="h-5 w-5" />,
        url: "https://github.com/tambo-ai/tambo",
      },
      {
        icon: <Icons.twitter className="h-5 w-5" />,
        url: "https://x.com/tambo_ai",
      },
    ],
    links: [
      { text: "Documentation", url: "/docs" },
      { text: "Discord", url: "https://discord.gg/dJNvPEHth6" },
      { text: "Twitter", url: "https://x.com/tambo_ai" },
    ],
    bottomText: "Fractal Dynamics Inc © 2024",
    brandText: "tambo ai",
  },
};

export type SiteConfig = typeof siteConfig;
