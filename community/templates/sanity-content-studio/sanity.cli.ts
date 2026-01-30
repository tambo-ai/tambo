import { defineCliConfig } from "sanity/cli";

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production";

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID,
  },
});
