export function getBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  return envBase && envBase.trim().length > 0 ? envBase : "https://ui.tambo.co";
}

export function isProduction(): boolean {
  // Next.js exposes NODE_ENV at build time
  return process.env.NODE_ENV === "production";
}
