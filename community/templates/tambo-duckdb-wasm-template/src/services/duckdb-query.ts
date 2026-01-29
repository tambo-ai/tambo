import {
    queryAsObjects,
    getTables,
    getTableSchema,
    getTableRowCount,
    initDuckDB,
    summarizeTable,
} from "@/services/duckdb";

/**
 * Helper to convert BigInt values to numbers for JSON serialization
 */
function serializeData(
    data: Record<string, unknown>[]
): Record<string, unknown>[] {
    return data.map((row) => {
        const serializedRow: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === "bigint") {
                serializedRow[key] = Number(value);
            } else if (value instanceof Date) {
                serializedRow[key] = value.toISOString();
            } else {
                serializedRow[key] = value;
            }
        }
        return serializedRow;
    });
}

/**
 * Execute a SQL query (for AI tool)
 */
export async function executeDuckDBQuery(params: {
    sql: string;
    limit?: number;
}) {
    try {
        await initDuckDB();

        let sql = params.sql.trim();
        if (params.limit && !sql.toLowerCase().includes("limit")) {
            sql = `${sql.replace(/;?\s*$/, "")} LIMIT ${params.limit}`;
        }

        const rawData = await queryAsObjects(sql);
        const data = serializeData(rawData);

        return { success: true, data, rowCount: data.length };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Get all available tables (for AI tool)
 */
export async function getAvailableTablesInfo() {
    try {
        await initDuckDB();

        const tableNames = await getTables();
        const tables = [];

        for (const tableName of tableNames) {
            const columns = await getTableSchema(tableName);
            const rawRowCount = await getTableRowCount(tableName);
            const rowCount =
                typeof rawRowCount === "bigint" ? Number(rawRowCount) : rawRowCount;
            tables.push({ tableName, columns, rowCount });
        }

        return { tables, totalTables: tables.length };
    } catch (error) {
        console.error("Failed to get tables info:", error);
        return { tables: [], totalTables: 0 };
    }
}

/**
 * Get table statistics using SUMMARIZE (for AI tool)
 */
export async function getTableStats(params: { tableName: string }) {
    try {
        await initDuckDB();

        const rawStats = await summarizeTable(params.tableName);
        const stats = serializeData(
            rawStats as unknown as Record<string, unknown>[]
        );

        return { success: true, stats };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
