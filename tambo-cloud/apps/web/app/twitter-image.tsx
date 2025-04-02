import { siteConfig } from "@/lib/config";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export const alt = "tambo - An AI powered Interface in a few lines of code";
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background images - using each octo exactly once */}
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-1.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "20px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-2.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "170px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-3.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "320px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-4.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "470px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-5.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "620px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-7.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "770px",
          }}
        />
        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-8.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "920px",
          }}
        />

        <img
          src={`${siteConfig.url}/assets/landing/drawings/OCTO-TRANSPARENT-9.svg`}
          style={{
            position: "absolute",
            width: "120px",
            bottom: "30px",
            left: "1070px",
          }}
        />

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
            An AI powered Interface in a few lines of code.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
