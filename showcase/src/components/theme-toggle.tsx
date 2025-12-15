"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Render a placeholder with the same dimensions during SSR
  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 hover:bg-muted rounded-full transition-colors relative w-9 h-9 border border-border"
        aria-label="Toggle theme"
      >
        <div className="relative w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 hover:bg-muted rounded-full transition-colors relative w-9 h-9 border border-border"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute h-5 w-5 transition-all ${
            resolvedTheme === "light"
              ? "rotate-0 scale-100"
              : "-rotate-90 scale-0"
          }`}
        />
        <Moon
          className={`absolute h-5 w-5 transition-all ${
            resolvedTheme === "dark"
              ? "rotate-0 scale-100"
              : "rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
