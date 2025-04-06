"use client";

import { Navbar } from "@/components/navbar";
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
        <main className="flex-1 flex flex-col">
          {isNotFoundPage ? (
            <div className="flex-grow">{children}</div>
          ) : (
            <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
              <div className="flex-grow">{children}</div>
            </TamboProvider>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
