"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { z } from "zod";

/**
 * Zod schema for preset configuration
 */
export const presetSchema = z.object({
  label: z.string().describe("Display label for the preset"),
  start: z.string().describe("ISO 8601 start date string"),
  end: z.string().describe("ISO 8601 end date string"),
});

/**
 * Zod schema for DateTimeRangePicker props
 */
export const dateTimeRangePickerPropsSchema = z.object({
  start: z
    .string()
    .optional()
    .describe("Selected start date as ISO 8601 string"),
  end: z.string().optional().describe("Selected end date as ISO 8601 string"),
  onChange: z
    .function()
    .args(
      z.object({
        start: z.string().nullable(),
        end: z.string().nullable(),
      }),
    )
    .returns(z.void())
    .describe("Callback when date range changes"),
  timezone: z
    .string()
    .optional()
    .default("UTC")
    .describe("Timezone for date interpretation"),
  presets: z.array(presetSchema).optional().describe("Quick selection presets"),
  minDate: z.string().optional().describe("Minimum selectable date (ISO)"),
  maxDate: z.string().optional().describe("Maximum selectable date (ISO)"),
  maxRangeDays: z.number().optional().describe("Maximum range length in days"),
  className: z.string().optional().describe("Additional CSS classes"),
  disabled: z.boolean().optional().describe("Whether picker is disabled"),
});

export type DateTimeRangePickerProps = z.infer<
  typeof dateTimeRangePickerPropsSchema
>;
export type Preset = z.infer<typeof presetSchema>;

/**
 * Variants for the DateTimeRangePicker component
 */
export const dateTimeRangePickerVariants = cva(
  "inline-flex flex-col gap-2 rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background",
        bordered: "border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Helper to generate common presets
 */
export const generateCommonPresets = (): Preset[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      label: "Today",
      start: today.toISOString(),
      end: now.toISOString(),
    },
    {
      label: "Last 7 Days",
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      end: now.toISOString(),
    },
    {
      label: "Last 30 Days",
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      end: now.toISOString(),
    },
    {
      label: "This Month",
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      end: now.toISOString(),
    },
    {
      label: "Last Month",
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      end: new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      ).toISOString(),
    },
  ];
};

/**
 * Validation helper
 */
const validateRange = (
  start: string | null,
  end: string | null,
  minDate?: string,
  maxDate?: string,
  maxRangeDays?: number,
): { valid: boolean; error?: string } => {
  if (!start || !end) {
    return { valid: true }; // Empty selection is valid
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Check inverted range
  if (startDate > endDate) {
    return { valid: false, error: "Start date must be before end date" };
  }

  // Check min/max bounds
  if (minDate && startDate < new Date(minDate)) {
    return {
      valid: false,
      error: `Start date cannot be before ${new Date(minDate).toLocaleDateString()}`,
    };
  }

  if (maxDate && endDate > new Date(maxDate)) {
    return {
      valid: false,
      error: `End date cannot be after ${new Date(maxDate).toLocaleDateString()}`,
    };
  }

  // Check max range length
  if (maxRangeDays) {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > maxRangeDays) {
      return {
        valid: false,
        error: `Range cannot exceed ${maxRangeDays} days`,
      };
    }
  }

  return { valid: true };
};

/**
 * Accessibility helper for screen reader announcements
 */
function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

/**
 * DateTimeRangePicker Component
 */
export const DateTimeRangePicker = React.forwardRef<
  HTMLDivElement,
  DateTimeRangePickerProps
>(
  (
    {
      start,
      end,
      onChange,
      timezone = "UTC",
      presets = generateCommonPresets(),
      minDate,
      maxDate,
      maxRangeDays,
      className,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const [internalStart, setInternalStart] = React.useState<string | null>(
      start || null,
    );
    const [internalEnd, setInternalEnd] = React.useState<string | null>(
      end || null,
    );
    const [validationError, setValidationError] = React.useState<
      string | undefined
    >();
    const [isOpen, setIsOpen] = React.useState(false);

    // Validate whenever dates change
    React.useEffect(() => {
      const validation = validateRange(
        internalStart,
        internalEnd,
        minDate,
        maxDate,
        maxRangeDays,
      );
      setValidationError(validation.error);
    }, [internalStart, internalEnd, minDate, maxDate, maxRangeDays]);

    const handlePresetClick = (preset: Preset) => {
      const validation = validateRange(
        preset.start,
        preset.end,
        minDate,
        maxDate,
        maxRangeDays,
      );

      if (!validation.valid) {
        setValidationError(validation.error);
        return;
      }

      setInternalStart(preset.start);
      setInternalEnd(preset.end);
      setValidationError(undefined);

      // Announce to screen readers
      const announcement = `Selected ${preset.label}: ${new Date(preset.start).toLocaleDateString()} to ${new Date(preset.end).toLocaleDateString()}`;
      announceToScreenReader(announcement);
    };

    const handleApply = () => {
      if (!validationError) {
        onChange({ start: internalStart, end: internalEnd });
        setIsOpen(false);
      }
    };

    const handleClear = () => {
      setInternalStart(null);
      setInternalEnd(null);
      setValidationError(undefined);
      onChange({ start: null, end: null });
      announceToScreenReader("Date range cleared");
    };

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString(undefined, {
        timeZone: timezone,
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          dateTimeRangePickerVariants({ variant: "bordered" }),
          className,
        )}
        {...props}
      >
        {/* Presets */}
        {presets.length > 0 && (
          <div
            className="flex flex-wrap gap-2 p-2"
            role="group"
            aria-label="Date range presets"
          >
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm bg-background border border-border text-foreground rounded hover:bg-muted focus-visible:ring focus-visible:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Date Display */}
        <div className="flex items-center gap-2 p-4 border-t border-border">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex-1 px-4 py-2 text-left bg-background border border-border rounded text-foreground hover:bg-muted focus-visible:ring focus-visible:ring-ring transition-colors disabled:opacity-50"
            type="button"
            aria-label="Select date range"
            aria-expanded={isOpen}
          >
            {internalStart && internalEnd ? (
              <span>
                {formatDate(internalStart)} — {formatDate(internalEnd)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Select a date range...
              </span>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={disabled || (!internalStart && !internalEnd)}
            className="px-3 py-2 bg-background border border-border text-foreground rounded hover:bg-muted focus-visible:ring focus-visible:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            aria-label="Clear date range"
          >
            Clear
          </button>

          <button
            onClick={handleApply}
            disabled={
              disabled || !!validationError || (!internalStart && !internalEnd)
            }
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 focus-visible:ring focus-visible:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Apply
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="px-4 pb-4" role="alert" aria-live="polite">
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationError}
            </p>
          </div>
        )}

        {/* TODO: Implement calendar UI when isOpen is true */}
        {/* This would include dual month views, date selection, time pickers */}
      </div>
    );
  },
);

DateTimeRangePicker.displayName = "DateTimeRangePicker";

/**
 * Intent handlers for AI to manipulate the date range
 */
export const dateTimeRangePickerIntents = {
  selectRange: z
    .object({
      start: z.string().describe("Start date ISO string"),
      end: z.string().describe("End date ISO string"),
    })
    .describe("Set the date range"),

  apply: z.object({}).describe("Confirm and apply the current selection"),

  clear: z.object({}).describe("Clear the selected date range"),
};

/**
 * Process intents from AI
 */
export function handleDateTimeRangePickerIntent(
  intent: keyof typeof dateTimeRangePickerIntents,
  params: any,
  currentState: { start: string | null; end: string | null },
  onChange: (range: { start: string | null; end: string | null }) => void,
) {
  switch (intent) {
    case "selectRange":
      onChange({ start: params.start, end: params.end });
      break;
    case "apply":
      // In real implementation, this would trigger validation and confirmation
      console.log("Apply intent triggered");
      break;
    case "clear":
      onChange({ start: null, end: null });
      break;
  }
}

DateTimeRangePicker.displayName = "DateTimeRangePicker";
