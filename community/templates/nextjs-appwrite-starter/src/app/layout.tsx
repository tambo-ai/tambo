import { AppwriteTamboProvider } from "@/components/appwrite-tambo-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tambo + Appwrite Starter",
  description: "AI-powered app with Appwrite authentication and Tambo UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppwriteTamboProvider>{children}</AppwriteTamboProvider>
      </body>
    </html>
  );
}
