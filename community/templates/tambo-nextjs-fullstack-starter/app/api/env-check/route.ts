import { NextResponse } from "next/server";

const ENV_KEYS = [
  "NEXT_PUBLIC_TAMBO_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "AUTH_URL",
  "DATABASE_URL",
] as const;

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const missing = ENV_KEYS.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === "",
  );
  return NextResponse.json({ missing });
}
