import type { Metadata } from "next";
import "./globals.css";
import { TamboWrapper } from "@/tambo/provider";

export const metadata: Metadata = {
  title: "DSA Visualizer | Tambo Template",
  description:
    "A starter template for building DSA/algorithm visualizers with Tambo's generative UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TamboWrapper>{children}</TamboWrapper>
      </body>
    </html>
  );
}
