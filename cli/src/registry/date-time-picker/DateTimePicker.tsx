"use client";

import React from "react";
import { z } from "zod";
import clsx from "clsx";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { useTambo } from "@tambo-ai/react";

export const dateTimePickerPropsSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  isRequired: z.boolean().optional(),
  includeTime: z.boolean().optional().default(true),
  timeFormat: z.enum(["12h", "24h"]).optional().default("12h"),
  showSubmitButton: z.boolean().optional().default(true),
  variant: z.enum(["outlined", "filled"]).optional().default("outlined"),
  size: z.enum(["small", "medium", "large"]).optional().default("medium"),
  stepMinutes: z.number().optional().default(5),
  value: z.string().nullable().optional(),
  onChange: z
    .function()
    .args(z.string().nullable())
    .returns(z.void())
    .optional(),
});

export type DateTimePickerProps = z.infer<typeof dateTimePickerPropsSchema>;

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    label = "Select Date & Time",
    description,
    placeholder = "Pick a date",
    min,
    max,
    isRequired,
    includeTime = true,
    timeFormat = "12h",
    showSubmitButton = true,
    variant = "outlined",
    size = "medium",
    stepMinutes = 5,
    value,
    onChange,
  } = props;

  const { sendThreadMessage } = useTambo();

  const [state, setState] = React.useState<{
    selectedDate?: Date;
    selectedTime: string;
    isCalendarOpen: boolean;
    value: string | null;
    focusedDate: Date;
  }>({
    selectedDate: undefined,
    selectedTime: "09:00",
    isCalendarOpen: false,
    value: null,
    focusedDate: new Date(),
  });

  // Sync value from props
  React.useEffect(() => {
    if (value !== state.value) {
      const isValidDate = value && !isNaN(new Date(value).getTime());
      setState({
        selectedDate: isValidDate ? new Date(value!) : undefined,
        selectedTime: isValidDate ? format(new Date(value!), "HH:mm") : "09:00",
        isCalendarOpen: false,
        value: isValidDate ? value : null,
        focusedDate: isValidDate ? new Date(value!) : new Date(),
      });
    }
  }, [value, state.value]);

  const emitValue = React.useCallback(
    (date?: Date) => {
      if (date) {
        const isoValue = date.toISOString();
        onChange?.(isoValue);
        setState((prev) => ({ ...prev, value: isoValue }));
      } else {
        onChange?.(null);
        setState((prev) => ({ ...prev, value: null }));
      }
    },
    [onChange],
  );

  const handleDateSelect = React.useCallback(
    (day: Date) => {
      const newDate = new Date(day);
      if (includeTime && state.selectedTime) {
        const [hours, minutes] = state.selectedTime.split(":").map(Number);
        newDate.setHours(hours, minutes);
      }
      setState((prev) => ({ ...prev, selectedDate: newDate }));
      if (!showSubmitButton) emitValue(newDate);
    },
    [includeTime, state.selectedTime, showSubmitButton, emitValue],
  );

  const handleTimeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newTime = event.target.value;
      setState((prev) => ({ ...prev, selectedTime: newTime }));
      if (state.selectedDate) {
        const updatedDate = new Date(state.selectedDate);
        const [hours, minutes] = newTime.split(":").map(Number);
        updatedDate.setHours(hours, minutes);
        if (!showSubmitButton) emitValue(updatedDate);
      }
    },
    [state.selectedDate, showSubmitButton, emitValue],
  );

  const handleSubmit = React.useCallback(() => {
    if (state.selectedDate) {
      emitValue(state.selectedDate);
      const humanReadable = format(state.selectedDate, "PPpp");
      sendThreadMessage(`Selected date and time: ${humanReadable}`);
    }
  }, [state.selectedDate, emitValue, sendThreadMessage]);

  const getFormattedValue = React.useCallback(() => {
    return state.selectedDate
      ? format(state.selectedDate, "PPpp")
      : placeholder;
  }, [state.selectedDate, placeholder]);

  // Generate proper calendar days
  const calendarDays = React.useMemo(() => {
    // FIX 1: Removed unused 'today' variable that was declared here.
    const start = startOfMonth(state.focusedDate);
    const end = endOfMonth(state.focusedDate);
    const days = eachDayOfInterval({ start, end });

    // Add padding days from previous month
    const startDay = getDay(start);
    const paddingDays = Array.from({ length: startDay }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() - (startDay - i));
      return { date, isCurrentMonth: false };
    });

    const currentMonthDays = days.map((date) => ({
      date,
      isCurrentMonth: true,
    }));

    return [...paddingDays, ...currentMonthDays];
  }, [state.focusedDate]);

  const minDate = React.useMemo(() => (min ? new Date(min) : null), [min]);
  const maxDate = React.useMemo(() => (max ? new Date(max) : null), [max]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-semibold text-sm">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-1">{description}</p>
      )}

      {/* Input Field */}
      <button
        className={clsx(
          "w-full rounded border p-2 text-left transition-colors",
          variant === "outlined" && "border-gray-300 hover:border-gray-400",
          variant === "filled" &&
            "bg-gray-100 border-transparent hover:bg-gray-200",
          size === "large" && "text-lg p-3",
          size === "small" && "text-sm p-1.5",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
        )}
        onClick={() =>
          setState((prev) => ({
            ...prev,
            isCalendarOpen: !prev.isCalendarOpen,
          }))
        }
        aria-expanded={state.isCalendarOpen}
        aria-haspopup="dialog"
      >
        {getFormattedValue()}
      </button>

      {/* Calendar Dropdown */}
      {state.isCalendarOpen && (
        <div className="mt-2 border rounded bg-white shadow-lg p-4 z-50 relative">
          {/* Month/Year Header */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  focusedDate: new Date(
                    prev.focusedDate.getFullYear(),
                    prev.focusedDate.getMonth() - 1,
                    1,
                  ),
                }))
              }
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Previous month"
            >
              ←
            </button>
            <h3 className="font-semibold">
              {format(state.focusedDate, "MMMM yyyy")}
            </h3>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  focusedDate: new Date(
                    prev.focusedDate.getFullYear(),
                    prev.focusedDate.getMonth() + 1,
                    1,
                  ),
                }))
              }
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="font-semibold p-2 text-gray-600">
                {d}
              </div>
            ))}
            {calendarDays.map(({ date, isCurrentMonth }, i) => {
              const isBeforeMin = minDate && date < minDate;
              const isAfterMax = maxDate && date > maxDate;

              const isDisabled = isBeforeMin ?? isAfterMax;
              const isSelected =
                state.selectedDate?.toDateString() === date.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={i}
                  disabled={!!isDisabled}
                  onClick={() => handleDateSelect(date)}
                  className={clsx(
                    "p-2 rounded hover:bg-gray-100 transition-colors",
                    !isCurrentMonth && "text-gray-300",
                    isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                    isToday && !isSelected && "bg-blue-50 text-blue-600",
                    isDisabled &&
                      "text-gray-200 cursor-not-allowed hover:bg-transparent",
                  )}
                  aria-label={format(date, "MMMM d, yyyy")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time Picker */}
          {includeTime && (
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium mb-2">Time</label>
              <select
                value={state.selectedTime}
                onChange={handleTimeChange}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select time"
              >
                {Array.from({ length: (24 * 60) / stepMinutes }, (_, i) => {
                  const totalMinutes = i * stepMinutes;
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  const timeValue = format(
                    new Date(0, 0, 0, hours, minutes),
                    "HH:mm",
                  );
                  const timeLabel =
                    timeFormat === "12h"
                      ? format(new Date(0, 0, 0, hours, minutes), "h:mm a")
                      : timeValue;

                  return (
                    <option key={i} value={timeValue}>
                      {timeLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={() =>
                setState((prev) => ({ ...prev, isCalendarOpen: false }))
              }
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {showSubmitButton && (
              <button
                onClick={handleSubmit}
                disabled={!state.selectedDate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
