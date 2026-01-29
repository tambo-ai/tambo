import { Geist_Mono } from "next/font/google";
import { Geist } from "next/font/google";
import localFont from "next/font/local";

// Load Geist fonts
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Load Sentient font
export const sentientLight = localFont({
  src: [
    {
      path: "../public/assets/fonts/sentient-light/Sentient-Light.woff2",
      weight: "300", // Light weight
      style: "normal",
    },
    {
      path: "../public/assets/fonts/sentient-light/Sentient-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/assets/fonts/sentient-light/Sentient-Regular.woff2",
      weight: "700", // Using Regular as Bold
      style: "normal",
    },
    {
      path: "../public/assets/fonts/sentient-light/Sentient-Italic.woff2",
      weight: "700", // Using Italic as Bold Italic
      style: "italic",
    },
  ],
  variable: "--font-sentient-light",
  display: "swap",
});
