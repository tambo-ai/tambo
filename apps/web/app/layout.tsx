import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { PreloadResources } from "@/components/preload-resources";
import { Schema } from "@/components/schema";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { MessageThreadPanel } from "@/components/ui/tambo/message-thread-panel";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { WebVitalsReporter } from "@/components/web-vitals";
import { siteConfig } from "@/lib/config";
import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/schema";
import { cn } from "@/lib/utils";
import { ComponentsThemeProvider } from "@/providers/components-theme-provider";
import { MessageThreadPanelProvider } from "@/providers/message-thread-panel-provider";
import { NextAuthProvider } from "@/providers/nextauth-provider";
import { TamboProviderWrapper } from "@/providers/tambo-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { Suspense } from "react";
import { authOptions } from "../lib/auth";
import "./globals.css";
import { PHProvider, PostHogPageview } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | " + siteConfig.name,
    default: `${siteConfig.name} | ${siteConfig.description}`,
  },
  description: siteConfig.metadata.description,
  keywords: siteConfig.keywords,
  metadataBase: new URL(siteConfig.url),
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],
  alternates: {
    canonical: "/",
  },
  icons: siteConfig.metadata.icons,
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "white" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate schema for the website and organization
  const websiteSchema = generateWebsiteSchema();
  const organizationSchema = generateOrganizationSchema();
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        `${GeistSans.variable} ${GeistMono.variable} ${sentientLight.variable}`,
      )}
    >
      <head>
        <PreloadResources />
      </head>
      <TamboProviderWrapper userId={session?.user?.id}>
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <Suspense>
          <WebVitalsReporter />
        </Suspense>
        <TRPCReactProvider>
          <PHProvider>
            <body
              className={cn(
                "min-h-screen bg-background antialiased w-full scroll-smooth font-sans",
              )}
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                forcedTheme="light"
              >
                <NextAuthProvider session={session}>
                  <PostHogIdentify />
                  <MessageThreadPanelProvider>
                    <div className="flex h-screen overflow-hidden w-full">
                      <main className="flex-1 min-w-0 overflow-auto snap-y snap-proximity">
                        {children}
                      </main>
                      <ComponentsThemeProvider defaultTheme="light">
                        <MessageThreadPanel />
                      </ComponentsThemeProvider>
                    </div>
                    <TailwindIndicator />
                  </MessageThreadPanelProvider>
                </NextAuthProvider>
              </ThemeProvider>
              <Toaster />
              <Analytics />
              <Schema jsonLd={[websiteSchema, organizationSchema]} />
            </body>
          </PHProvider>
        </TRPCReactProvider>
      </TamboProviderWrapper>
    </html>
  );
}
