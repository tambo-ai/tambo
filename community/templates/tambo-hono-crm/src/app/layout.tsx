import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tambo CRM",
  description: "AI-powered CRM with generative UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
