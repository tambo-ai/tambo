import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import ClientLayout from "./client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clerk + Tambo Starter",
  description: "A minimal starter template with Clerk authentication and Tambo AI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getToken } = await auth();
  const token = await getToken();

  return (
    <html lang="en">
      <body>
        <ClientLayout userToken={token ?? undefined}>{children}</ClientLayout>
      </body>
    </html>
  );
}
