import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TamboProvider } from "@/providers/TamboProvider";
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
  title: "AI Innovation Hackathon 2026 | Build the Future with AI",
  description: "Join 500+ developers, designers, and innovators for 48 hours of coding, creativity, and collaboration. Build AI-powered solutions that make a difference!",
  keywords: ["hackathon", "AI", "artificial intelligence", "coding", "innovation", "tech event"],
  authors: [{ name: "AI Innovation Team" }],
  openGraph: {
    title: "AI Innovation Hackathon 2026",
    description: "Build the Future with AI 🚀 - 48 hours of coding, creativity, and collaboration",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white min-h-screen`}
      >
        <TamboProvider>
          {children}
        </TamboProvider>
      </body>
    </html>
  );
}
