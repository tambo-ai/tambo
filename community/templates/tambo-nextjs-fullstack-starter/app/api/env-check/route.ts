import { NextResponse } from "next/server";

const ENV_KEYS = [
  "NEXT_PUBLIC_TAMBO_API_KEY",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "AUTH_URL",
  "DATABASE_URL",
] as const;

export async function GET() {
  const missing = ENV_KEYS.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === "",
  );
  return NextResponse.json({ missing });
}
