"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/providers/theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { usePathname } from "next/navigation";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isNotFoundPage = pathname === "/_not-found";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <Sidebar />
        <div>
          <main className="pb-16">
            {isNotFoundPage ? (
              <div className="container mx-auto">{children}</div>
            ) : (
              <TamboProvider
                apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              >
                <div className="container mx-auto">{children}</div>
              </TamboProvider>
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
