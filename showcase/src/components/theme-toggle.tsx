"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Render a placeholder with the same dimensions during SSR
  if (!mounted) {
    return (
      <button
        className="p-2 hover:bg-muted rounded-full transition-colors relative w-9 h-9 border border-border"
        aria-label="Toggle theme"
      >
        <div className="relative w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 hover:bg-muted rounded-full transition-colors relative w-9 h-9 border border-border"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute h-5 w-5 transition-all ${
            theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
          }`}
        />
        <Moon
          className={`absolute h-5 w-5 transition-all ${
            theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
          }`}
        />
        <Monitor
          className={`absolute h-5 w-5 transition-all ${
            theme === "system" ? "rotate-0 scale-100" : "rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
