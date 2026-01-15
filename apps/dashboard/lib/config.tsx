import { Icons } from "@/components/icons";
import { env } from "@/lib/env";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "tambo-ai",
  description:
    "An open-source AI orchestration framework for your React front end.",
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:8260",
  keywords: [
    "AI-Powered React Components",
    "Contextual UI Generation",
    "Dynamic Interface Adaptation",
    "Conversational UI Framework",
    "React AI Integration",
    "Intelligent Component Routing",
    "Adaptive User Experiences",
    "Context-Aware Interfaces",
    "Natural Language UI",
    "AI UX Development",
    "React User Experience",
    "AI-Driven Component Selection",
    "AI Co-Pilot for React",
    "UI Co-Agent Framework",
    "Developer Co-Pilot",
    "Automated UI Assistant",
    "Client Side MCP Integration",
    "Server Side MCP Integration",
    "React AI Agent Framework",
    "Generative UI Components",
    "MCP OAuth Integration",
    "Model Context Protocol",
    "AI Component Streaming",
    "MCP Client Server",
  ],
  links: {
    email: "support@tambo.co",
    twitter: "https://x.com/tambo_ai",
    discord: "https://discord.gg/dJNvPEHth6",
    github: "https://github.com/tambo-ai/tambo",
    docs: process.env.NEXT_PUBLIC_DOCS_URL || "/docs",
  },
  metadata: {
    title: "Add React UI to your AI agent/copilot | tambo-ai",
    description:
      "An open-source AI orchestration framework for your React front end.",
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: "Add React UI to your AI agent/copilot | tambo-ai",
      description:
        "An open-source AI orchestration framework for your React front end.",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Screenshot of tambo-ai's adaptive UI component selection interface",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Add React UI to your AI agent/copilot | tambo-ai",
      description:
        "An open-source AI orchestration framework for your React front end.",
      images: [
        {
          url: "/twitter-image.png",
          width: 1200,
          height: 630,
          alt: "Screenshot of tambo-ai's adaptive UI component selection interface",
        },
      ],
    },
  },
  footer: {
    socialLinks: [
      {
        icon: <Icons.github className="h-5 w-5" />,
        url: "https://github.com/tambo-ai/tambo",
      },
      {
        icon: <Icons.twitter className="h-4 w-4" />,
        url: "https://x.com/tambo_ai",
      },
      {
        icon: <Icons.discord className="h-5 w-5" />,
        url: "https://discord.gg/dJNvPEHth6",
      },
    ],
    links: [
      { text: "Documentation", url: "/docs" },
      { text: "License", url: "/license" },
      { text: "Privacy Notice", url: "/privacy" },
      { text: "Terms of Use", url: "/terms" },
    ],
    bottomText: "Fractal Dynamics Inc © 2025",
    brandText: "tambo-ai",
  },
};

export type SiteConfig = typeof siteConfig;
