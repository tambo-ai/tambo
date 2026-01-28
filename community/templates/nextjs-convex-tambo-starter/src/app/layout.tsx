import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { TamboProvider } from "@/providers/TamboProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tambo AI CRM Starter",
  description: "Next.js + Convex + Tambo AI Starter Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} antialiased bg-black text-white`}
        suppressHydrationWarning
      >
        <ConvexClientProvider>
          <TamboProvider>{children}</TamboProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
