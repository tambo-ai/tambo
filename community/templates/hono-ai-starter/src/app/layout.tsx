import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hono AI Starter",
  description: "Minimal edge-ready starter for Tambo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-50 antialiased">
        {/* We move the Provider to the Page level to avoid SSR Worker errors */}
        {children}
      </body>
    </html>
  );
}