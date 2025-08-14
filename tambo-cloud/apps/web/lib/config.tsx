import { Icons } from "@/components/icons";
import { env } from "@/lib/env";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "tambo-ai",
  description:
    "Build AI-powered React components that intelligently adapt to user context. Create dynamic interfaces that respond to natural language, driving more engaging and intuitive user experiences with minimal code.",
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
  ],
  links: {
    email: "support@tambo.co",
    twitter: "https://x.com/tambo_ai",
    discord: "https://discord.gg/dJNvPEHth6",
    github: "https://github.com/tambo-ai/tambo",
  },
  metadata: {
    title: "An AI-Powered Interface in a Few Lines of Code | tambo-ai",
    description:
      "Build AI-powered React components that intelligently adapt to user context. Create dynamic interfaces that respond to natural language, driving more engaging and intuitive user experiences with minimal code.",
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: "tambo-ai - An AI-Powered Interface in a Few Lines of Code",
      description:
        "Build AI-powered React components that intelligently adapt to user context. Create dynamic interfaces that respond to natural language, driving more engaging and intuitive user experiences with minimal code.",
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
      title: "An AI-Powered Interface in a Few Lines of Code | tambo-ai",
      description:
        "Build AI-powered React components that intelligently adapt to user context. Create dynamic interfaces that respond to natural language, driving more engaging and intuitive user experiences with minimal code.",
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
        icon: <Icons.twitter className="h-5 w-5" />,
        url: "https://x.com/tambo_ai",
      },
    ],
    links: [
      { text: "Documentation", url: "/docs" },
      { text: "Discord", url: "https://discord.gg/dJNvPEHth6" },
      { text: "Twitter", url: "https://x.com/tambo_ai" },
      { text: "Privacy Notice", url: "/privacy" },
      { text: "Terms of Use", url: "/terms" },
      { text: "License", url: "/license" },
    ],
    bottomText: "Fractal Dynamics Inc © 2024",
    brandText: "tambo-ai",
  },
};

export type SiteConfig = typeof siteConfig;
