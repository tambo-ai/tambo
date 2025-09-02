import "@/app/global.css";
import { TamboProvider } from "@tambo-ai/react";
import { RootProvider } from "fumadocs-ui/provider";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { components } from "@/lib/tambo";
import { PostHogPageview, PHProvider } from "@/app/providers";
import { Suspense } from "react";
import { WebVitalsReporter } from "@/components/web-vitals";
import type { Metadata } from "next";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Tambo AI Documentation",
    description:
      "The documentation for Tambo AI - Build AI-powered applications with React components and streaming.",
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
        <TamboProvider
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL!}
          components={components}
        >
          <Suspense>
            <PostHogPageview />
          </Suspense>
          <Suspense>
            <WebVitalsReporter />
          </Suspense>
          <PHProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
            >
              <RootProvider>{children as React.ReactNode}</RootProvider>
            </ThemeProvider>
          </PHProvider>
        </TamboProvider>
      </body>
    </html>
  );
}
