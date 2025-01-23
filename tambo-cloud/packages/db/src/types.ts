import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import {
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

/**
 * Interface to the Hydra database. This is preferred over explicit
 * HydraDatabase or HydraTransaction, so that you can do most operations
 * without having to know if you're in or out of a transaction.
 */
export type HydraDb = HydraDatabase | HydraTransaction;
