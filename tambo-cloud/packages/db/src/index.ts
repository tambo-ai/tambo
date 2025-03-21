import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";

let globalPool: Pool | null = null;

const MAX_POOL_SIZE = 50;

function getDb(databaseUrl: string): HydraDatabase {
  // quick hack to get the db connection
  if (!globalPool) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: MAX_POOL_SIZE,
    });

    pool.on("acquire", () => {
      console.log(`Connection acquired (${pool.totalCount}/${pool.idleCount})`);
    });

    pool.on("release", () => {
      console.log(`Connection released (${pool.totalCount}/${pool.idleCount})`);
    });

    globalPool = pool;
  }
  console.log(
    `[${globalPool.totalCount} connections (${globalPool.idleCount} idle)]`,
  );
  const db = drizzle(globalPool, { schema });

  return db;
}

async function closeDb() {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}

export * from "./types";
export { closeDb, getDb, operations, schema };
