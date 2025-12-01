import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "tambo-ui | A component library for Generative Interfaces";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  const title = "tambo-ui | A component library for Generative Interfaces";
  const tagline =
    "Build natural language interfaces with React. Use our component library to build your app in a weekend.";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#0B0B0B",
          color: "white",
          padding: "72px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.9,
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
