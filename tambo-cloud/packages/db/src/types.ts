import { ExtractTablesWithRelations } from "drizzle-orm";
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { type Pool } from "pg";
import * as schema from "./schema";

export type HydraDatabase = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

export type HydraTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Interface to the Hydra database. This is preferred over explicit
 * HydraDatabase or HydraTransaction, so that you can do most operations
 * without having to know if you're in or out of a transaction.
 */
export type HydraDb = HydraDatabase | HydraTransaction;
