import { authOptions } from "@/auth";
import Providers from "@/components/authentication/providers";
import ClientLayout from "@/components/tamboAuthentication/client-layout";
import { sentientLight } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tambo NextJS Fullstack Starter",
    template: "%s | Tambo Starter",
  },
  description:
    "A production-ready Next.js template with Tambo AI, Google OAuth, and PostgreSQL.",
  keywords: [
    "Next.js",
    "Tambo AI",
    "Google OAuth",
    "PostgreSQL",
    "Full-Stack",
    "TypeScript",
    "React",
    "AI Assistant",
  ],

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Tambo NextJS Fullstack Starter",
    description:
      "A production-ready Next.js template with Tambo AI, Google OAuth, and PostgreSQL. ",
    siteName: "Tambo Starter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tambo NextJS Fullstack Starter",
    description:
      "A production-ready Next.js template with Tambo AI, Google OAuth, and PostgreSQL.",
    creator: "@yourhandle", // Update with your Twitter handle
  },
  // Next.js App Router automatically detects favicon.ico in the app directory
  // The icons configuration below is optional but helps with browser compatibility
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} ${sentientLight.variable} antialiased`,
        )}
      >
        <Providers>
          <ClientLayout userToken={session?.accessToken}>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
