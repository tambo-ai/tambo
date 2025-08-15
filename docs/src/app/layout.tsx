import "@/app/global.css";
import { TamboProvider } from "@tambo-ai/react";
import { RootProvider } from "fumadocs-ui/provider";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <TamboProvider
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL!}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            <RootProvider>{children as React.ReactNode}</RootProvider>
          </ThemeProvider>
        </TamboProvider>
      </body>
    </html>
  );
}
