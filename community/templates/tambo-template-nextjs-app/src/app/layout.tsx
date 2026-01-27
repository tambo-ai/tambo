import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tambo Template",
  description: "Next.js App Router template with Tambo",
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
