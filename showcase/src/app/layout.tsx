"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { GeistMono, GeistSans, sentientLight } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        `${GeistSans.variable} ${GeistMono.variable} ${sentientLight.variable}`,
      )}
    >
      <body className={`${GeistSans.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}>
            <div className="pt-16">{children}</div>
          </TamboProvider>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
