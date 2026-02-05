import "@/app/global.css";
import { GlobalJsonLd } from "@/components/json-ld";
import { WebVitalsReporter } from "@/components/web-vitals";
import { cn } from "@/lib/utils";
import {
  PostHogPageview,
  PostHogRootProvider,
} from "@/providers/posthog-provider";
import { TamboRootProvider } from "@/providers/tambo-provider";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Suspense } from "react";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";
const logoUrl = new URL("/logo/lockup/Tambo-Lockup.png", baseUrl).toString();
const docsDescription =
  "Tambo is an open-source generative UI toolkit for React. Register your components—the agent renders them based on user messages.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Tambo Docs",
    template: "%s | Tambo Docs",
  },
  description: docsDescription,
  keywords: [
    "Tambo",
    "generative UI",
    "React SDK",
    "AI components",
    "Model Context Protocol",
    "MCP",
    "streaming components",
    "AI-powered interfaces",
    "React hooks",
    "component rendering",
  ],
  authors: [{ name: "Tambo AI", url: "https://tambo.co" }],
  creator: "Tambo AI",
  publisher: "Tambo AI",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tambo Docs",
    description: docsDescription,
    url: baseUrl,
    siteName: "Tambo Docs",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "Tambo AI - Generative UI SDK for React",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tambo Docs",
    description: docsDescription,
    site: "@tamborino",
    creator: "@tamborino",
    images: [logoUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(inter.className, "tambo-theme")}
      suppressHydrationWarning
    >
      <head>
        <GlobalJsonLd />
      </head>
      <body className="flex flex-col min-h-screen">
        <TamboRootProvider>
          <Suspense>
            <PostHogPageview />
          </Suspense>
          <Suspense>
            <WebVitalsReporter />
          </Suspense>
          <PostHogRootProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
            >
              <RootProvider>{children}</RootProvider>
            </ThemeProvider>
          </PostHogRootProvider>
        </TamboRootProvider>
      </body>
    </html>
  );
}
