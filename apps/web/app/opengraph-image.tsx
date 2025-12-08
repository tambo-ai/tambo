import { siteConfig } from "@/lib/config";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export const alt =
  "tambo - A react package for adding generative UI to your AI assistant";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F2F8F6",
        backgroundImage: "linear-gradient(to bottom right, #F2F8F6, #E5F0ED)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <img
          src={`${siteConfig.url}/logo/lockup/Tambo-Lockup.svg`}
          alt="Tambo Logo"
          style={{ height: 200 }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 50px",
          textAlign: "center",
          color: "black",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: 32,
            fontWeight: "bold",
            fontStyle: "italic",
            margin: "0 0 16px",
            maxWidth: "800px",
            fontFamily: "Georgia, serif",
          }}
        >
          A react package for adding generative UI to your AI assistant.
        </p>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
