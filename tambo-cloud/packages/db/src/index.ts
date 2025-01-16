import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export type HydraDatabase = PostgresJsDatabase<typeof schema>;

function getDb(databaseUrl: string): HydraDatabase {
  // quick hack to get the db connection
  const client = postgres(databaseUrl, { prepare: false });

  const db = drizzle(client, { schema });

  return db;
}

export { getDb, schema };
