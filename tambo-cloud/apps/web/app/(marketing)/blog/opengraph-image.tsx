import { siteConfig } from "@/lib/config";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export const alt = `${siteConfig.name} Blog - Latest news and updates`;
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
          backgroundColor: "white",
          backgroundImage: "linear-gradient(to bottom right, #FFFFFF, #F0F0F0)",
        }}
      >
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
          <img
            src={`${siteConfig.url}/assets/landing/wordmark-placeholder.png`}
            alt="Tambo Logo"
            style={{ width: 100, height: 100, marginBottom: 20 }}
          />
          <h1
            style={{
              fontSize: 64,
              fontWeight: "bold",
              margin: "0 0 20px",
            }}
          >
            {siteConfig.name} Blog
          </h1>
          <p
            style={{
              fontSize: 32,
              margin: "0 0 40px",
              maxWidth: "800px",
            }}
          >
            Latest news and updates
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
