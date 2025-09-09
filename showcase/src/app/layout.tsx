import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "../styles/showcase-theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | tambo",
    default: "tambo | Build AI-powered apps with just one line of code",
  },
  description: "Build AI-powered apps with just one line of code",
  keywords: ["Tambo", "Showcase", "Components", "AI", "App Development"],
  metadataBase: new URL("https://tambo.co"),
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
    title: "tambo",
    description: "Build AI-powered apps with just one line of code",
    url: "https://tambo.co",
    siteName: "tambo",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "tambo"
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tambo",
    description: "Build AI-powered apps with just one line of code",
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
