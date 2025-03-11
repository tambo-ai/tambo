import { siteConfig } from "@/lib/config";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export const alt = "tambo - Build AI-powered apps in just one line of code";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F2F8F6",
          backgroundImage: "linear-gradient(to bottom right, #F2F8F6, #FFEBF5)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 0,
          }}
        >
          <img
            src={`${siteConfig.url}/assets/landing/octo-standing-placeholder.png`}
            alt="Tambo Logo"
            style={{ height: 150 }}
          />
          <img
            src={`${siteConfig.url}/assets/landing/wordmark-placeholder.png`}
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
          }}
        >
          <p
            style={{
              fontSize: 32,
              margin: "0 0 40px",
              maxWidth: "800px",
            }}
          >
            {siteConfig.description}
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
