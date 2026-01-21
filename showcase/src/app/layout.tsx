import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
  PostHogPageview,
  PostHogRootProvider,
} from "@/providers/posthog-provider";
import "leaflet/dist/leaflet.css";
import { Suspense } from "react";
import "./globals.css";

export const metadata = {
  title: {
    template: "%s | tambo-ui",
    default: "tambo-ui | A component library for Generative Interfaces",
  },
  description:
    "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
  keywords: ["Tambo", "Showcase", "Components", "AI", "App Development"],
  metadataBase: new URL("https://ui.tambo.co"),
  authors: [
    {
      name: "tambo",
      url: "https://tambo.co",
    },
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: "website",
    url: "https://ui.tambo.co",
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    siteName: "tambo-ui",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "tambo-ui Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        `${GeistSans.variable} ${GeistMono.variable} ${sentientLight.variable}`,
      )}
    >
      <head>
        {/* Add base CSS variables */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --header-height: 57px;
          }
        `,
          }}
        />
      </head>
      <body className={`${GeistSans.className} font-sans antialiased`}>
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <PostHogRootProvider>{children}</PostHogRootProvider>
      </body>
    </html>
  );
}
