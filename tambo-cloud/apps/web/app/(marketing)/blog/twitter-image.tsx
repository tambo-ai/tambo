import { siteConfig } from "@/lib/config";
import OGImage from "./opengraph-image";

export const runtime = "edge";
export const alt = `${siteConfig.name} Blog - Latest news and updates`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default OGImage;
