import { env } from "@/lib/env";

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  if (env.NODE_ENV === "development") {
    return `http://localhost:${env.PORT ?? 3000}`;
  }
  return "";
}
