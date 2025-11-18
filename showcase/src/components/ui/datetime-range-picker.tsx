"use client";

import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

export const dateTimeRangePickerSchema = z.object({
  start: z.string().describe("Start date-time in ISO format"),
  end: z.string().describe("End date-time in ISO format"),
  preset: z
    .string()
    .optional()
    .describe("Optional quick preset like 'today', 'last_7_days', etc."),
});

export type DateTimeRangePickerProps = z.infer<
  typeof dateTimeRangePickerSchema
>;

export const DateTimeRangePicker = ({
  start,
  end,
  preset,
}: DateTimeRangePickerProps) => {
  const [range, setRange] = useState({
    start: start || new Date().toISOString(),
    end: end || new Date().toISOString(),
  });

  return (
    <div className="w-full max-w-md border rounded-xl p-4 space-y-4 bg-white shadow-sm">
      <h2 className="font-semibold text-lg">Date Time Range Picker</h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">Start</label>
        <input
          type="datetime-local"
          className="border px-3 py-2 rounded-lg"
          value={format(new Date(range.start), "yyyy-MM-dd'T'HH:mm")}
          onChange={(e) =>
            setRange((prev) => ({
              ...prev,
              start: new Date(e.target.value).toISOString(),
            }))
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">End</label>
        <input
          type="datetime-local"
          className="border px-3 py-2 rounded-lg"
          value={format(new Date(range.end), "yyyy-MM-dd'T'HH:mm")}
          onChange={(e) =>
            setRange((prev) => ({
              ...prev,
              end: new Date(e.target.value).toISOString(),
            }))
          }
        />
      </div>

      {preset && (
        <p className="text-sm text-gray-500">
          Active preset: <strong>{preset}</strong>
        </p>
      )}

      <div className="text-xs text-gray-400 mt-3">
        <p>Start: {range.start}</p>
        <p>End: {range.end}</p>
      </div>
    </div>
  );
};
