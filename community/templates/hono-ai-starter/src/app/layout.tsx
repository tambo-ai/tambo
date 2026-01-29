import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hono AI Starter | Tambo",
  description: "A high-performance, edge-ready generative UI starter powered by Hono and Tambo AI.",
  // Standard metadata for modern AI templates
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* 1. Changed bg-zinc-950 to bg-background to use your Tailwind v4 theme
          2. Added suppressHydrationWarning to prevent Next.js 15 theme-flicker errors 
      */}
      <body className="bg-background text-foreground antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}