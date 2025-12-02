import { ImageResponse } from "next/og";

export const runtime = "edge";

// Example: /og?title=Custom%20Title&tagline=Your%20tagline
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const title =
    searchParams.get("title") ??
    "tambo-ui | A component library for Generative Interfaces";
  const tagline =
    searchParams.get("tagline") ??
    "Build natural language interfaces with React. Use our component library to build your app in a weekend.";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#ffffff",
        color: "#0b0b0b",
        padding: "72px",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 0, transparent 40%), radial-gradient(circle at 80% 30%, rgba(0,0,0,0.04) 0, transparent 45%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Octo icon */}
        <img
          src={`${origin}/logo/icon/Octo-Icon.svg`}
          width={48}
          height={48}
          style={{ display: "block" }}
        />
        <div style={{ fontSize: 28, opacity: 0.9 }}>tambo-ui</div>
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: -1,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 28,
          maxWidth: 1000,
          opacity: 0.9,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 60,
          fontSize: 22,
          opacity: 0.6,
        }}
      >
        ui.tambo.co
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=31536000",
      },
    },
  );
}
