import { ThemeProvider } from "next-themes";
import * as React from "react";
import "../styles/showcase-theme.css";

interface ShowcaseThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}

export function ShowcaseThemeProvider({
  children,
  defaultTheme = "light",
}: ShowcaseThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      value={{
        light: "showcase-theme",
        dark: "showcase-theme dark",
      }}
    >
      <div className="showcase-theme w-full">{children}</div>
    </ThemeProvider>
  );
}
