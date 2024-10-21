import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "hydra-ai - Generative UI for your web app",
  description:
    "hydra-ai is a generative UI for your web app. It allows you to create custom UI components for your web app.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "hydra-ai - Generative UI for your web app",
    description: "Create custom UI components for your web app with hydra-ai",
    images: [
      {
        url: "https://usehydra.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "hydra-ai Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hydra-ai - Generative UI for your web app",
    description: "Create custom UI components for your web app with hydra-ai",
    images: ["https://usehydra.ai/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn("min-h-screen bg-background", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />

          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
