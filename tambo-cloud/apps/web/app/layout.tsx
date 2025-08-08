import { PreloadResources } from "@/components/preload-resources";
import { Schema } from "@/components/schema";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { MessageThreadCollapsible } from "@/components/ui/tambo/message-thread-collapsible";
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
import { NextAuthProvider } from "@/providers/nextauth-provider";
import { TamboProviderWrapper } from "@/providers/tambo-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { Analytics } from "@vercel/analytics/react";
import { RootProvider } from "fumadocs-ui/provider";
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
      <TamboProviderWrapper>
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
                "min-h-screen bg-background antialiased w-full mx-auto scroll-smooth font-sans flex flex-col snap-y snap-proximity",
              )}
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                forcedTheme="light"
              >
                <NextAuthProvider session={session}>
                  <RootProvider search={{ enabled: true }}>
                    {children}
                  </RootProvider>
                  <ComponentsThemeProvider defaultTheme="light">
                    <MessageThreadCollapsible
                      className="z-50"
                      defaultOpen={false}
                    />
                  </ComponentsThemeProvider>
                  <TailwindIndicator />
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
