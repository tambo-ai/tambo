/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sw-yellow': '#FFE81F',
        'sw-blue': '#00D9FF',
        'sw-space': '#0A0E27',
        'sw-light': '#4A9EFF',
        'sw-dark': '#FF0000',
      },
      fontFamily: {
        'star-wars': ['system-ui', 'sans-serif'],
      },
      animation: {
        'crawl': 'crawl 60s linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'hologram': 'hologram 0.5s ease-in-out infinite',
      },
      keyframes: {
        crawl: {
          '0%': { top: '100%', transform: 'rotateX(20deg) translateZ(0)' },
          '100%': { top: '-100%', transform: 'rotateX(20deg) translateZ(-2500px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px currentColor)' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 12px currentColor)' },
        },
        hologram: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
