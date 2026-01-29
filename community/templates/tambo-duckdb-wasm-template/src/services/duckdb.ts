import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

let db: AsyncDuckDB | null = null;
let conn: AsyncDuckDBConnection | null = null;

/**
 * Initialize DuckDB-WASM with automatic bundle selection
 */
export async function initDuckDB(): Promise<{
    db: AsyncDuckDB;
    conn: AsyncDuckDBConnection;
}> {
    if (db && conn) {
        return { db, conn };
    }

    const duckdb = await import("@duckdb/duckdb-wasm");

    // Use JsDelivr CDN bundles
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select the best bundle for the browser
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: "text/javascript",
        })
    );

    // Create worker and logger
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();

    // Instantiate DuckDB
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    // Create connection
    conn = await db.connect();

    return { db, conn };
}

/**
 * Get the current DuckDB connection
 */
export async function getConnection(): Promise<AsyncDuckDBConnection> {
    if (!conn) {
        await initDuckDB();
    }
    return conn!;
}

/**
 * Execute a SQL query and return the result as an Arrow table
 */
export async function query(sql: string) {
    const connection = await getConnection();
    return connection.query(sql);
}

/**
 * Execute a SQL query and return results as JavaScript objects
 */
export async function queryAsObjects<T = Record<string, unknown>>(
    sql: string
): Promise<T[]> {
    const result = await query(sql);
    return result.toArray().map((row: { toJSON: () => T }) => row.toJSON());
}

/**
 * Get list of all tables in the database
 */
export async function getTables(): Promise<string[]> {
    const result = await queryAsObjects<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
    );
    return result.map((row) => row.table_name);
}

/**
 * Get schema information for a table
 */
export async function getTableSchema(
    tableName: string
): Promise<{ column_name: string; data_type: string }[]> {
    return queryAsObjects<{ column_name: string; data_type: string }>(
        `DESCRIBE "${tableName}"`
    );
}

/**
 * Get row count for a table
 */
export async function getTableRowCount(tableName: string): Promise<number> {
    const result = await queryAsObjects<{ count: number }>(
        `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return result[0]?.count ?? 0;
}

/**
 * Column summary statistics from SUMMARIZE
 */
export interface ColumnSummary {
    column_name: string;
    column_type: string;
    min: string | null;
    max: string | null;
    approx_unique: number | bigint;
    avg: number | null;
    std: number | null;
    q25: string | null;
    q50: string | null;
    q75: string | null;
    count: number | bigint;
    null_percentage: number;
}

/**
 * Get summary statistics for a table using DuckDB's SUMMARIZE
 */
export async function summarizeTable(tableName: string): Promise<ColumnSummary[]> {
    const result = await queryAsObjects<ColumnSummary>(
        `SUMMARIZE SELECT * FROM "${tableName}"`
    );
    return result;
}

/**
 * Load a CSV file from a browser File object into DuckDB
 */
export async function loadCSVFile(
    file: File,
    tableName: string
): Promise<{ rowCount: number; columns: { column_name: string; data_type: string }[] }> {
    if (!db) {
        await initDuckDB();
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Register the file in DuckDB's virtual file system
    await db!.registerFileBuffer(file.name, uint8Array);

    const connection = await getConnection();
    await connection.query(`
    CREATE OR REPLACE TABLE "${tableName}" AS 
    SELECT * FROM read_csv_auto('${file.name}')
  `);

    const columns = await getTableSchema(tableName);
    const rowCount = await getTableRowCount(tableName);

    return { rowCount, columns };
}

/**
 * Load a Parquet file from a browser File object into DuckDB
 */
export async function loadParquetFile(
    file: File,
    tableName: string
): Promise<{ rowCount: number; columns: { column_name: string; data_type: string }[] }> {
    if (!db) {
        await initDuckDB();
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await db!.registerFileBuffer(file.name, uint8Array);

    const connection = await getConnection();
    await connection.query(`
    CREATE OR REPLACE TABLE "${tableName}" AS 
    SELECT * FROM read_parquet('${file.name}')
  `);

    const columns = await getTableSchema(tableName);
    const rowCount = await getTableRowCount(tableName);

    return { rowCount, columns };
}

/**
 * Load a JSON file from a browser File object into DuckDB
 */
export async function loadJSONFile(
    file: File,
    tableName: string
): Promise<{ rowCount: number; columns: { column_name: string; data_type: string }[] }> {
    if (!db) {
        await initDuckDB();
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await db!.registerFileBuffer(file.name, uint8Array);

    const connection = await getConnection();
    await connection.query(`
    CREATE OR REPLACE TABLE "${tableName}" AS 
    SELECT * FROM read_json_auto('${file.name}')
  `);

    const columns = await getTableSchema(tableName);
    const rowCount = await getTableRowCount(tableName);

    return { rowCount, columns };
}

/**
 * Load a data file (CSV, Parquet, or JSON) based on file extension
 */
export async function loadDataFile(
    file: File,
    tableName?: string
): Promise<{
    tableName: string;
    rowCount: number;
    columns: { column_name: string; data_type: string }[];
    fileType: "csv" | "parquet" | "json";
}> {
    const extension = file.name.split(".").pop()?.toLowerCase();

    // Generate table name from file name if not provided
    const finalTableName =
        tableName ||
        file.name
            .replace(/\.[^/.]+$/, "") // Remove extension
            .replace(/[^a-zA-Z0-9_]/g, "_") // Replace special chars with underscore
            .replace(/^(\d)/, "_$1"); // Prefix with underscore if starts with number

    let result;
    let fileType: "csv" | "parquet" | "json";

    switch (extension) {
        case "csv":
            result = await loadCSVFile(file, finalTableName);
            fileType = "csv";
            break;
        case "parquet":
            result = await loadParquetFile(file, finalTableName);
            fileType = "parquet";
            break;
        case "json":
            result = await loadJSONFile(file, finalTableName);
            fileType = "json";
            break;
        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }

    return {
        tableName: finalTableName,
        ...result,
        fileType,
    };
}

/**
 * Drop a table from the database
 */
export async function dropTable(tableName: string): Promise<void> {
    const connection = await getConnection();
    await connection.query(`DROP TABLE IF EXISTS "${tableName}"`);
}

/**
 * Close the DuckDB connection and terminate the worker
 */
export async function closeDuckDB(): Promise<void> {
    if (conn) {
        await conn.close();
        conn = null;
    }
    if (db) {
        await db.terminate();
        db = null;
    }
}
