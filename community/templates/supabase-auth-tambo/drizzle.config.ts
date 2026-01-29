import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
