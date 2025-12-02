// This file tells TypeScript how to handle SVG imports in the showcase app
declare module "*.svg" {
  import React from "react";

  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
