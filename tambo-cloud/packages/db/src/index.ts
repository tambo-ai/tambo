import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import {
  drizzle,
  PostgresJsDatabase,
  PostgresJsQueryResultHKT,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
export type HydraDatabase = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql;
};

export type HydraTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

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

export { closeDb, getDb, schema };
