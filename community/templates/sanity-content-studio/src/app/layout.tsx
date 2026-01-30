import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Content Studio | Tambo + Sanity",
  description: "Manage your Sanity CMS content with AI-powered conversations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} min-h-screen antialiased selection:bg-white/20 selection:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
