import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load .env.local
config({ path: ".env.local" });

async function runMigrations() {
  const connection = postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });
  const db = drizzle(connection);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
  console.log("Migrations completed!");

  await connection.end();
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
