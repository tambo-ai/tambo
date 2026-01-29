import { type SalesRecord } from '@/data/sales';
import Papa from 'papaparse';
import React, { useState } from 'react';
import { z } from 'zod';

const salesRecordSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    region: z.string().min(1, 'Region is required'),
    category: z.string().min(1, 'Category is required'),
    product: z.string().min(1, 'Product is required'),
    revenue: z.union([z.number(), z.string()]).transform((val) => {
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(num)) throw new Error('Revenue must be a valid number');
        return num;
    }),
});

export interface DataUploaderProps {
    onDataUpload: (data: SalesRecord[]) => void;
    currentRowCount?: number;
}

export const DataUploader: React.FC<DataUploaderProps> = ({ onDataUpload, currentRowCount = 0 }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            setSuccess(false);
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    if (results.errors.length > 0) {
                        throw new Error(`CSV parsing error: ${results.errors[0].message}`);
                    }

                    if (results.data.length === 0) {
                        throw new Error('CSV file is empty');
                    }

                    const requiredColumns = ['date', 'region', 'category', 'product', 'revenue'];
                    const headers = Object.keys(results.data[0] || {});
                    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

                    if (missingColumns.length > 0) {
                        throw new Error(
                            `Missing required columns: ${missingColumns.join(', ')}. ` +
                            `Required: date, region, category, product, revenue`
                        );
                    }

                    const validatedData: SalesRecord[] = [];
                    const validationErrors: string[] = [];

                    results.data.forEach((row, index) => {
                        try {
                            const validated = salesRecordSchema.parse(row);
                            validatedData.push(validated);
                        } catch (err) {
                            if (err instanceof z.ZodError) {
                                validationErrors.push(`Row ${index + 2}: ${err.errors[0].message}`);
                            } else {
                                validationErrors.push(`Row ${index + 2}: ${String(err)}`);
                            }
                        }
                    });

                    if (validationErrors.length > 0 && validatedData.length === 0) {
                        throw new Error(
                            `All rows failed validation. First error: ${validationErrors[0]}`
                        );
                    }

                    if (validationErrors.length > 0) {
                        console.warn('Some rows were skipped:', validationErrors);
                    }

                    onDataUpload(validatedData);
                    setSuccess(true);
                    setUploading(false);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to parse CSV');
                    setSuccess(false);
                    setUploading(false);
                }
            },
            error: (err) => {
                setError(`File reading error: ${err.message}`);
                setUploading(false);
                setSuccess(false);
            },
        });
    };

    return (
        <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Upload Your Data</h3>
                <p className="text-sm text-muted-foreground">
                    Upload a CSV file to analyze your own business data
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="csv-upload"
                        className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/50 px-6 py-8 transition-colors hover:border-primary hover:bg-muted"
                    >
                        <div className="text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-muted-foreground"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="mt-4 flex text-sm text-muted-foreground">
                                <span className="font-medium text-primary">Click to upload</span>
                                <span className="ml-1">or drag and drop</span>
                            </div>
                            <p className="text-xs text-muted-foreground">CSV files only</p>
                        </div>
                    </label>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                </div>

                {uploading && (
                    <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                        Processing CSV file...
                    </div>
                )}

                {success && currentRowCount > 0 && (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                        ✓ Successfully loaded {currentRowCount} rows
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                        <p className="font-semibold">Upload failed</p>
                        <p className="mt-1">{error}</p>
                    </div>
                )}

                <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                    <p className="font-semibold text-foreground">Required CSV format:</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>• <strong>date</strong> - Transaction date (e.g., 2025-10-01)</li>
                        <li>• <strong>region</strong> - Sales region (e.g., North America)</li>
                        <li>• <strong>category</strong> - Product category (e.g., Electronics)</li>
                        <li>• <strong>product</strong> - Product name (e.g., Laptop Pro)</li>
                        <li>• <strong>revenue</strong> - Revenue amount (e.g., 125000)</li>
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Note: If you have an Excel file, export it as CSV first
                    </p>
                </div>
            </div>
        </div>
    );
};
