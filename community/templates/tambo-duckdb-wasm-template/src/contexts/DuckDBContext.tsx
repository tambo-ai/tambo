"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
    initDuckDB,
    loadDataFile,
    dropTable,
    getTables,
    getTableSchema,
    queryAsObjects,
    summarizeTable,
    type ColumnSummary,
} from "@/services/duckdb";

/**
 * Represents a loaded data file in DuckDB
 */
export interface LoadedDataFile {
    id: string;
    fileName: string;
    tableName: string;
    fileType: "csv" | "parquet" | "json";
    rowCount: number | bigint;
    columns: { column_name: string; data_type: string }[];
    summary: ColumnSummary[];
    loadedAt: Date;
}

/**
 * Context value for DuckDB data management
 */
interface DuckDBContextValue {
    isReady: boolean;
    isInitializing: boolean;
    loadedFiles: LoadedDataFile[];
    addDataFile: (file: File) => Promise<LoadedDataFile>;
    removeDataFile: (id: string) => Promise<void>;
    executeQuery: <T = Record<string, unknown>>(sql: string) => Promise<T[]>;
    getAvailableTables: () => Promise<string[]>;
    getSchema: (tableName: string) => Promise<{ column_name: string; data_type: string }[]>;
    error: Error | null;
}

const DuckDBContext = createContext<DuckDBContextValue | null>(null);

/**
 * Provider component for DuckDB data management
 */
export function DuckDBProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [loadedFiles, setLoadedFiles] = useState<LoadedDataFile[]>([]);
    const [error, setError] = useState<Error | null>(null);

    // Lazy initialization - DuckDB is initialized on first use
    const ensureInitialized = useCallback(async () => {
        if (isReady) return;
        if (isInitializing) {
            while (isInitializing) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        setIsInitializing(true);
        try {
            await initDuckDB();
            setIsReady(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsInitializing(false);
        }
    }, [isReady, isInitializing]);

    const addDataFile = useCallback(
        async (file: File): Promise<LoadedDataFile> => {
            await ensureInitialized();

            const result = await loadDataFile(file);
            const summary = await summarizeTable(result.tableName);

            const loadedFile: LoadedDataFile = {
                id: crypto.randomUUID(),
                fileName: file.name,
                tableName: result.tableName,
                fileType: result.fileType,
                rowCount: result.rowCount,
                columns: result.columns,
                summary,
                loadedAt: new Date(),
            };

            setLoadedFiles((prev) => [...prev, loadedFile]);
            return loadedFile;
        },
        [ensureInitialized]
    );

    const removeDataFile = useCallback(
        async (id: string) => {
            const file = loadedFiles.find((f) => f.id === id);
            if (file) {
                await dropTable(file.tableName);
                setLoadedFiles((prev) => prev.filter((f) => f.id !== id));
            }
        },
        [loadedFiles]
    );

    const executeQuery = useCallback(
        async <T = Record<string, unknown>>(sql: string): Promise<T[]> => {
            if (!isReady) {
                throw new Error("DuckDB is not initialized");
            }
            return queryAsObjects<T>(sql);
        },
        [isReady]
    );

    const getAvailableTables = useCallback(async () => {
        if (!isReady) {
            throw new Error("DuckDB is not initialized");
        }
        return getTables();
    }, [isReady]);

    const getSchema = useCallback(
        async (tableName: string) => {
            if (!isReady) {
                throw new Error("DuckDB is not initialized");
            }
            return getTableSchema(tableName);
        },
        [isReady]
    );

    const value: DuckDBContextValue = {
        isReady,
        isInitializing,
        loadedFiles,
        addDataFile,
        removeDataFile,
        executeQuery,
        getAvailableTables,
        getSchema,
        error,
    };

    return (
        <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
    );
}

/**
 * Hook to access DuckDB context
 */
export function useDuckDBContext() {
    const context = useContext(DuckDBContext);
    if (!context) {
        throw new Error("useDuckDBContext must be used within a DuckDBProvider");
    }
    return context;
}

/**
 * Accepted file types for data files
 */
export const DATA_FILE_ACCEPT = ".csv,.parquet,.json";

/**
 * Check if a file is a supported data file
 */
export function isDataFile(file: File): boolean {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return ["csv", "parquet", "json"].includes(extension ?? "");
}
