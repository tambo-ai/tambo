import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";

let globalDb: HydraDatabase | null = null;

const MAX_POOL_SIZE = 30;

function getDb(databaseUrl: string): HydraDatabase {
  if (globalDb) {
    return globalDb;
  }
  // quick hack to get the db connection

  const pool = new Pool({ connectionString: databaseUrl, max: MAX_POOL_SIZE });
  const db = drizzle(pool, { schema });

  globalDb = db;
  return db;
}

async function closeDb() {
  if (globalDb) {
    await globalDb.$client.end();
    globalDb = null;
  }
}

export * from "./types";
export { closeDb, getDb, operations, schema };
