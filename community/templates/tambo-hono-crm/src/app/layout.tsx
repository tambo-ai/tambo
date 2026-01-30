import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Intelligence - AI-Powered Relationship Management",
  description:
    "Build relationships that adapt to your business with AI-powered CRM intelligence",
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
