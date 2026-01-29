"use client";

import React, { useState } from "react";
import { Database, FileSpreadsheet, X, Table2, Loader2 } from "lucide-react";
import {
    useDuckDBContext,
    DATA_FILE_ACCEPT,
    isDataFile,
} from "@/contexts/DuckDBContext";

/**
 * Props for the DataFileButton component
 */
export interface DataFileButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    multiple?: boolean;
}

/**
 * File icon based on file type
 */
function FileTypeIcon({
    fileType,
    className,
}: {
    fileType: string;
    className?: string;
}) {
    switch (fileType) {
        case "csv":
            return <FileSpreadsheet className={className} />;
        case "parquet":
            return <Table2 className={className} />;
        case "json":
            return <Database className={className} />;
        default:
            return <FileSpreadsheet className={className} />;
    }
}

/**
 * Data file attachment button component
 */
export const DataFileButton = React.forwardRef<
    HTMLButtonElement,
    DataFileButtonProps
>(({ className, multiple = true, ...props }, ref) => {
    const { addDataFile } = useDuckDBContext();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).filter(isDataFile);

        if (files.length === 0) return;

        setIsLoading(true);
        try {
            for (const file of files) {
                await addDataFile(file);
            }
        } catch (error) {
            console.error("Failed to load data file:", error);
        } finally {
            setIsLoading(false);
        }

        e.target.value = "";
    };

    return (
        <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={className}
            aria-label="Attach Data Files"
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Database className="w-4 h-4" />
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={DATA_FILE_ACCEPT}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
            />
        </button>
    );
});
DataFileButton.displayName = "DataFileButton";

/**
 * Format row count for display
 */
function formatRowCount(count: number | bigint): string {
    const numCount = typeof count === "bigint" ? Number(count) : count;
    if (numCount >= 1000000) {
        return `${(numCount / 1000000).toFixed(1)}M`;
    }
    if (numCount >= 1000) {
        return `${(numCount / 1000).toFixed(1)}K`;
    }
    return numCount.toString();
}

/**
 * Component to display loaded data files
 */
export function LoadedDataFilesList() {
    const { loadedFiles, removeDataFile } = useDuckDBContext();

    if (loadedFiles.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2">
            {loadedFiles.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg"
                >
                    <FileTypeIcon fileType={file.fileType} className="w-4 h-4" />
                    <span className="text-sm">{file.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                        ({formatRowCount(file.rowCount)} rows)
                    </span>
                    <button
                        onClick={() => removeDataFile(file.id)}
                        className="ml-1 hover:text-destructive"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}
