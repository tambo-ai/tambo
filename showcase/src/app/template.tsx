"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/providers/theme-provider";
import { TamboProvider } from "@tambo-ai/react";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Navbar />
      <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}>
        <div className="pt-16">{children}</div>
      </TamboProvider>
      <Footer />
    </ThemeProvider>
  );
}
