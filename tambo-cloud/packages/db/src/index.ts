import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";

function getDb(databaseUrl: string): HydraDatabase {
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });

  return db;
}

async function closeDb() {}

export * from "./types";
export { closeDb, getDb, operations, schema };
