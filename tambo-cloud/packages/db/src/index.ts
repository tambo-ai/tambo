import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";
export { ActionType } from "./ActionType";
export { MessageRole } from "./MessageRole";

let globalDb: HydraDatabase | null = null;

function getDb(databaseUrl: string): HydraDatabase {
  if (globalDb) {
    return globalDb;
  }
  // quick hack to get the db connection
  const client = postgres(databaseUrl, { prepare: false });

  const db = drizzle(client, { schema });

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
