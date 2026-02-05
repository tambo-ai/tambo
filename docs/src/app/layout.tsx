import "@/app/global.css";
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
const docsDescription =
  "Tambo is an open-source generative UI toolkit for React. Register your components—the agent renders them based on user messages.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Tambo Docs",
    template: "%s | Tambo Docs",
  },
  description: docsDescription,
  openGraph: {
    title: "Tambo Docs",
    description: docsDescription,
    url: baseUrl,
    siteName: "Tambo Docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tambo Docs",
    description: docsDescription,
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
    <html
      lang="en"
      className={cn(inter.className, "tambo-theme")}
      suppressHydrationWarning
    >
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
