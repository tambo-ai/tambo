import { authOptions } from "@/auth";
import Providers from "@/components/authentication/providers";
import ClientLayout from "@/components/tamboAuthentication/client-layout";

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

  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
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
          `${geistSans.variable} ${geistMono.variable}  antialiased`,
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
