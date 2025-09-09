import "@/app/global.css";
import { WebVitalsReporter } from "@/components/web-vitals";
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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Tambo AI Documentation",
    template: "%s | Tambo AI Docs",
  },
  description:
    "The documentation for Tambo AI - Build AI-powered applications with React components and streaming.",
  openGraph: {
    title: "Tambo AI Documentation",
    description:
      "The documentation for Tambo AI - Build AI-powered applications with React components and streaming.",
    url: baseUrl,
    siteName: "Tambo AI Docs",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Tambo AI Documentation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tambo AI Documentation",
    description:
      "The documentation for Tambo AI - Build AI-powered applications with React components and streaming.",
    images: "/twitter-image",
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
};

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
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
              <RootProvider>{children as React.ReactNode}</RootProvider>
            </ThemeProvider>
          </PostHogRootProvider>
        </TamboRootProvider>
      </body>
    </html>
  );
}
