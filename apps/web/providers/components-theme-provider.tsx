import { ThemeProvider } from "next-themes";
import * as React from "react";
import "../styles/components-theme.css";

interface ComponentsThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}

export function ComponentsThemeProvider({
  children,
  defaultTheme = "light",
}: ComponentsThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      forcedTheme={defaultTheme}
      value={{
        light: "components-theme",
        dark: "components-theme dark",
      }}
    >
      <div className="components-theme">{children}</div>
    </ThemeProvider>
  );
}
