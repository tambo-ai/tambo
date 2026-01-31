import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Star Wars Tambo Template",
  description: "An immersive Star Wars themed AI chat with generative UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
