import { Icons } from "@/components/icons";
import { env } from "@/lib/env";
import {
  BrainIcon,
  CodeIcon,
  PaletteIcon,
  PuzzleIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Hydra AI",
  description: "Build Adaptive UIs with AI",
  cta: "Get Started",
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "AI UI Generation",
    "React Components",
    "Adaptive Interfaces",
    "UI Automation",
  ],
  links: {
    email: "support@usehydra.ai",
    twitter: "https://x.com/usehydraai",
    discord: "https://discord.gg/dJNvPEHth6",
    github: "https://github.com/use-hydra-ai/hydra-ai",
  },
  metadata: {
    title: "Build Adaptive UIs with AI | Hydra AI",
    description:
      "Hydra AI is an AI-powered router that surfaces the right features to users based on context. Build adaptive UIs for your web app with ease.",
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: "Build Adaptive UIs with AI | Hydra AI",
      description:
        "AI-powered router surfaces the right features to users based on context",
      images: [
        {
          url: "https://usehydra.ai/og-image.png",
          width: 1200,
          height: 630,
          alt: "Hydra AI - Build Adaptive UIs with AI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Build Adaptive UIs with AI | Hydra AI",
      description:
        "AI-powered router surfaces the right features to users based on context",
      images: ["https://usehydra.ai/twitter-image.png"],
    },
  },
  hero: {
    title: "Build Adaptive UIs with AI",
    description:
      "AI-powered router surfaces the right features to users based on context",
    cta: "Get Started",
    ctaDescription: "In only a few minutes",
  },
  features: [
    {
      name: "AI-Powered UI Generation",
      description:
        "Hydra AI leverages advanced machine learning to generate responsive and context-aware user interfaces based on natural language instructions.",
      icon: <BrainIcon className="h-6 w-6" />,
    },
    {
      name: "Rapid Prototyping",
      description:
        "Accelerate your development process with Hydra AI's ability to quickly generate and iterate on UI components, reducing time-to-market.",
      icon: <ZapIcon className="h-6 w-6" />,
    },
    {
      name: "Seamless Integration",
      description:
        "Easily integrate Hydra AI into your existing React projects with our intuitive API and comprehensive documentation.",
      icon: <PuzzleIcon className="h-6 w-6" />,
    },
    {
      name: "Customizable Styling",
      description:
        "Maintain brand consistency with Hydra AI's ability to adapt to your project's design system and theming preferences.",
      icon: <PaletteIcon className="h-6 w-6" />,
    },
    {
      name: "Code Generation",
      description:
        "Generate clean, maintainable React code for your AI-created components, allowing for easy customization and extension.",
      icon: <CodeIcon className="h-6 w-6" />,
    },
    {
      name: "Intelligent Suggestions",
      description:
        "Receive AI-powered suggestions for UI improvements and optimizations based on best practices and user interaction patterns.",
      icon: <SparklesIcon className="h-6 w-6" />,
    },
  ],
  pricing: [
    {
      name: "Free",
      price: { monthly: "$0", yearly: "$0" },
      frequency: { monthly: "month", yearly: "year" },
      description: "Perfect for trying out Hydra AI",
      features: [
        "1 team member",
        "1 GB storage",
        "Up to 2 pages",
        "Community support",
        "AI assistance",
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Premium",
      price: { monthly: "$45", yearly: "$450" },
      frequency: { monthly: "month", yearly: "year" },
      description: "For professional developers",
      features: [
        "4 team members",
        "8 GB storage",
        "Up to 6 pages",
        "Priority support",
        "AI assistance",
      ],
      popular: true,
      cta: "Get Started",
    },
    {
      name: "Enterprise",
      price: { monthly: "$120", yearly: "Custom" },
      frequency: { monthly: "month", yearly: "year" },
      description: "For large organizations",
      features: [
        "10 team members",
        "20 GB storage",
        "Up to 10 pages",
        "Phone & email support",
        "AI assistance",
      ],
      cta: "Contact Us",
    },
  ],
  footer: {
    socialLinks: [
      {
        icon: <Icons.github className="h-5 w-5" />,
        url: "https://github.com/usehydraai",
      },
      {
        icon: <Icons.twitter className="h-5 w-5" />,
        url: "https://x.com/usehydraai",
      },
    ],
    links: [
      { text: "Documentation", url: "/docs" },
      { text: "Discord", url: "https://discord.gg/dJNvPEHth6" },
      { text: "Twitter", url: "https://x.com/usehydraai" },
    ],
    bottomText: "Fractal Dynamics Inc © 2024",
    brandText: "HYDRA AI",
  },

  testimonials: [
    {
      id: 1,
      text: "Hydra AI has revolutionized how we build user interfaces. The AI-powered generation is incredibly intuitive.",
      name: "Alice Johnson",
      company: "OpenMind Labs",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 2,
      text: "We've significantly reduced development time using Hydra AI. The rapid prototyping feature is a game-changer.",
      name: "Bob Brown",
      company: "NeuralForge",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 3,
      text: "The seamless integration allowed us to incorporate Hydra AI into our existing React projects effortlessly.",
      name: "Charlie Davis",
      company: "CodeHarbor",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 4,
      text: "Hydra AI's customizable styling has helped us maintain perfect brand consistency across our applications.",
      name: "Diana Evans",
      company: "AutomateX",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 5,
      text: "The code generation feature produces clean, maintainable React components that are easy to customize.",
      name: "Ethan Ford",
      company: "AICore",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 6,
      text: "Hydra AI's intelligent suggestions have helped us optimize our UIs and improve user experience significantly.",
      name: "Fiona Grant",
      company: "ScaleAI",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 7,
      text: "The intuitive API has made it easy for our team to quickly prototype and deploy new UI features.",
      name: "George Harris",
      company: "RapidAI",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDR8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 8,
      text: "Hydra AI's adaptive interfaces have enabled us to build dynamic, context-aware UIs with ease.",
      name: "Hannah Irving",
      company: "CollabAI",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 9,
      text: "The flexibility in customizing generated components has expanded our UI capabilities tremendously.",
      name: "Ian Johnson",
      company: "FlexAI",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 10,
      text: "Hydra AI's documentation and support have made our learning curve much smoother.",
      name: "Julia Kim",
      company: "DevAI",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjR8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 11,
      text: "We've seen a significant boost in development speed thanks to Hydra AI's code generation capabilities.",
      name: "Kevin Lee",
      company: "DecisionTech",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzB8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 12,
      text: "The AI-powered UI generation has revolutionized our approach to front-end development.",
      name: "Laura Martinez",
      company: "SolveX",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzZ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 13,
      text: "The customization options in Hydra AI have allowed us to create truly unique user interfaces.",
      name: "Michael Chen",
      company: "UniqueAI",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 14,
      text: "The efficiency of Hydra AI has significantly reduced our UI development time and costs.",
      name: "Natalie Wong",
      company: "FastTrackAI",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODh8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
    {
      id: 15,
      text: "The comprehensive documentation has made it easy for our team to leverage all of Hydra AI's features.",
      name: "Oliver Smith",
      company: "GlobalAI",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTR8fHBvcnRyYWl0fGVufDB8fDB8fHww",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
