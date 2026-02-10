import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";

let globalPool: Pool | null = null;

// Max number of open connections in the app-side pg.Pool.
// When behind a connection pooler (e.g. Supavisor), this limits how many
// concurrent connections the app can hold to the pooler — not to Postgres directly. (For "medium" size postgres cluster, max is 600 from all sources, so this is our own extra limit and depends on how many our server can handle)
const MAX_POOL_SIZE = 75;

function getPool(databaseUrl: string): Pool {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: databaseUrl,
      max: MAX_POOL_SIZE,
      connectionTimeoutMillis: 10000,
    });
    // Uncomment to debug connection pool issues
    // globalPool.on("acquire", () => {
    //   console.log(
    //     `Connection acquired: now → ${globalPool.totalCount}/${globalPool.idleCount} (total/idle)`,
    //   );
    // });
    // globalPool.on("release", () => {
    //   console.log(
    //     `Connection released: now → ${globalPool.totalCount}/${globalPool.idleCount} (total/idle) (released connection takes a few ms to be marked as idle)`,
    //   );
    // });
  }
  return globalPool;
}
async function getDbClient(databaseUrl: string): Promise<PoolClient> {
  const pool = getPool(databaseUrl);
  const client = await pool.connect();
  return client;
}

/**
 * Convenience helper that ensures a `PoolClient` is always released back to the pool.
 *
 * Usage:
 * ```ts
 * const result = await withDbClient(env.DATABASE_URL, async (client) => {
 *   const { rows } = await client.query("select now()");
 *   return rows[0];
 * });
 * ```
 *
 * The client is automatically released whether the callback resolves or throws.
 */
export async function withDbClient<T>(
  databaseUrl: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getDbClient(databaseUrl);
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

function getDb(databaseUrl: string): HydraDatabase {
  const pool = getPool(databaseUrl);
  // console.log(
  //   `Database status: ${pool.totalCount} connections (${pool.idleCount} idle)`,
  // );
  const db = drizzle(pool, { schema });
  return db;
}

async function closeDb() {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}

export * from "./converters/message-converters";
export * from "./oauth/OAuthLocalProvider";
export { ThreadNotFoundError } from "./operations/thread";
export * from "./types";
export { closeDb, getDb, operations, schema }; // `withDbClient` exported above
