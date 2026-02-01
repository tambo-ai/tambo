import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* ===============================
       * CORE COLOR TOKENS (CSS VARS)
       * =============================== */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* ===============================
         * CYBERPUNK / NEON PALETTE
         * =============================== */
        neon: {
          cyan: "#00f6ff",
          magenta: "#ff2bd6",
          green: "#39ff14",
          purple: "#7c3aed",
          blue: "#1f8cff",
        },

        cyber: {
          bg: "#05060a",
          panel: "#0b0f1a",
          grid: "rgba(0,246,255,0.08)",
          glowCyan: "rgba(0,246,255,0.45)",
          glowMagenta: "rgba(255,43,214,0.45)",
          glowGreen: "rgba(57,255,20,0.45)",
        },
      },

      /* ===============================
       * BORDER RADIUS
       * =============================== */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      /* ===============================
       * BOX SHADOWS (NEON GLOWS)
       * =============================== */
      boxShadow: {
        "neon-cyan":
          "0 0 10px rgba(0,246,255,0.35), 0 0 30px rgba(0,246,255,0.25)",
        "neon-magenta":
          "0 0 10px rgba(255,43,214,0.35), 0 0 30px rgba(255,43,214,0.25)",
        "neon-green":
          "0 0 10px rgba(57,255,20,0.35), 0 0 30px rgba(57,255,20,0.25)",
        "panel-glow": "0 0 40px rgba(0,246,255,0.15)",
        "panel-glow-strong": "0 0 60px rgba(255,43,214,0.35)",
        insetGlow: "inset 0 0 25px rgba(0,246,255,0.25)",
      },

      /* ===============================
       * BACKGROUND IMAGES
       * =============================== */
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(0,246,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,246,255,0.08) 1px, transparent 1px)",
        "cyber-radial":
          "radial-gradient(circle at top, rgba(0,246,255,0.12), transparent 60%)",
        scanlines:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
      },

      backgroundSize: {
        grid: "40px 40px",
      },

      /* ===============================
       * ANIMATIONS
       * =============================== */
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 19%, 22%, 62%, 64%, 70%, 100%": {
            opacity: "1",
          },
          "20%, 21%, 63%": {
            opacity: "0.4",
          },
        },
      },

      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        scanline: "scanline 6s linear infinite",
        flicker: "flicker 3s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
