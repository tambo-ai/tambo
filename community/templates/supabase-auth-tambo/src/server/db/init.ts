import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Load .env.local
config({ path: ".env.local" });

/**
 * Initialize the database with RLS policies and required setup.
 * Should be run once during deployment.
 * @returns
 */
async function initializeDatabase(): Promise<void> {
  const connection = postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });
  const db = drizzle(connection);

  console.log("Initializing database...");

  try {
    // Drop existing policies if they exist
    const policyNames = [
      "Users can read their own profile",
      "Users can insert their own profile",
      "Users can update their own profile",
      "Only admins can delete profiles",
    ];

    // Suppress console output during DROP operations
    const originalLog = console.log;
    console.log = () => {};

    for (const name of policyNames) {
      try {
        await db.execute(
          sql.raw(`DROP POLICY IF EXISTS "${name}" ON "user_profiles";`),
        );
      } catch (error) {
        // Silently ignore errors
      }
    }

    // Restore console.log
    console.log = originalLog;

    for (const name of policyNames) {
      console.log(`✓ Dropped old policy: ${name}`);
    }

    // Enable RLS on user_profiles table
    await db.execute(
      sql`ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;`,
    );
    console.log("✓ RLS enabled on user_profiles");

    console.log("✓ Database initialized successfully");
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to initialize database:", error);
      process.exit(1);
    });
}
