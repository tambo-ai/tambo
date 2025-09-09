import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "../styles/showcase-theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | tambo-ui",
    default: "tambo-ui | A component library for Generative Interfaces",
  },
  description:
    "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
  keywords: ["Tambo", "Showcase", "Components", "AI", "App Development"],
  metadataBase: new URL("https://tambo.co"),
  authors: [
    {
      name: "tambo-ui",
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
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    url: "https://tambo.co",
    siteName: "tambo-ui",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "tambo-ui"
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tambo-ui | A component library for Generative Interfaces",
    description:
      "Build natural language interfaces with React. Use our component library to build your app in a weekend.",
    images: "/twitter-image",
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
        {children}
      </body>
    </html>
  );
}
