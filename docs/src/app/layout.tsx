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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.tambo.co";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "tambo-ui | A component library for Generative Interfaces",
    template: "%s | tambo-ui",
  },
  description:
    "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
  openGraph: {
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    url: baseUrl,
    siteName: "tambo-ui",
    type: "website",
    images: [
      {
        url: new URL("/opengraph-image", baseUrl).toString(),
        width: 1200,
        height: 630,
        alt: "tambo-ui",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    images: new URL("/twitter-image", baseUrl).toString(),
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
              <RootProvider>{children}</RootProvider>
            </ThemeProvider>
          </PostHogRootProvider>
        </TamboRootProvider>
      </body>
    </html>
  );
}
