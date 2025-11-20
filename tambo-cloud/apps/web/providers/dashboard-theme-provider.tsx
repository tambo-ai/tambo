import { ThemeProvider } from "next-themes";
import * as React from "react";
import "../styles/dashboard-theme.css";

interface DashboardThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}

export function DashboardThemeProvider({
  children,
  defaultTheme = "light",
}: DashboardThemeProviderProps) {
  // Apply / clean-up theme classes on the <body> element
  React.useEffect(() => {
    const { classList } = document.body;

    classList.add("dashboard-theme");
    if (defaultTheme === "dark") {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }

    return () => {
      classList.remove("dashboard-theme", "dark");
    };
  }, [defaultTheme]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      value={{
        light: "dashboard-theme",
        dark: "dashboard-theme dark",
      }}
    >
      {children}
    </ThemeProvider>
  );
}
