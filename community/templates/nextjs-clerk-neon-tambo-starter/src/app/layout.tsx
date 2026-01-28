import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Tambo Notes - AI-Powered Note Taking",
    description: "A Next.js starter template with Clerk authentication, Neon database, and Tambo AI integration",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className="antialiased">
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
