import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cronos: {
          primary: "#002D74",
          secondary: "#00D2FF",
          accent: "#7B61FF",
          dark: "#0A1628",
          light: "#E8F4FF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
