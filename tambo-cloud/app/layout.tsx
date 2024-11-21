import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { RootProvider } from "fumadocs-ui/provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background flex flex-col",
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider>{children}</RootProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
