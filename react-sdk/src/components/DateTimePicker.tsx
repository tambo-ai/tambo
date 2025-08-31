"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { z } from "zod";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isValid,
  Locale,
} from "date-fns";
import clsx from "clsx";

// ✅ Zod schema for type safety
export const dateTimePickerPropsSchema = z.object({
  value: z.string().datetime().nullable().optional(),
  onChange: z.function().args(z.string().nullable()).returns(z.void()),
  timezone: z.string().optional(),
  min: z.string().datetime().optional(),
  max: z.string().datetime().optional(),
  stepMinutes: z.number().default(5),
  locale: z.any().optional(),
  hourCycle: z.enum(["h12", "h24"]).optional().default("h24"),
});

export type DateTimePickerProps = z.infer<typeof dateTimePickerPropsSchema> & {
  locale?: Locale;
};

/**
 * DateTimePicker component for selecting date and time with keyboard navigation
 * @returns React functional component
 */
export function DateTimePicker({
  value,
  onChange,
  timezone,
  min,
  max,
  stepMinutes = 5,
  locale,
  hourCycle = "h24",
}: DateTimePickerProps) {
  const defaultTimezone =
    timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null); // ✅ focus tracking
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Initialize from `value`
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (isValid(date)) {
        setSelectedDate(date);
        setCurrentMonth(date);
        setSelectedHours(getHours(date));
        setSelectedMinutes(getMinutes(date));
        setPeriod(getHours(date) >= 12 ? "PM" : "AM");
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // ✅ Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ✅ Focused date when opening
  useEffect(() => {
    if (isOpen) {
      setFocusedDate(selectedDate ?? new Date());
    }
  }, [isOpen, selectedDate]);

  // ✅ Generate calendar days
  const daysInMonth = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      }),
    [currentMonth],
  );

  const displayHours = useMemo(
    () =>
      Array.from({ length: hourCycle === "h12" ? 12 : 24 }, (_, i) =>
        hourCycle === "h12" ? i + 1 : i,
      ),
    [hourCycle],
  );

  const minutes = useMemo(
    () => Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes),
    [stepMinutes],
  );

  const daysOfWeek = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        format(addDays(new Date(2023, 0, 1), i), "EE", { locale }),
      ),
    [locale],
  );

  // ✅ Emit selected value in ISO format
  const emitValue = useCallback(
    (date: Date | null, hours: number, minutes: number) => {
      if (!date) {
        onChange(null);
        return;
      }
      const finalDate = setMinutes(setHours(date, hours), minutes);
      onChange(finalDate.toISOString());
    },
    [onChange],
  );

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    emitValue(day, selectedHours, selectedMinutes);
    setIsOpen(false);
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setSelectedHours(newHours);
    setSelectedMinutes(newMinutes);
    if (selectedDate) {
      emitValue(selectedDate, newHours, newMinutes);
    }
  };

  // ✅ Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focusedDate) return;
    let newDate = new Date(focusedDate);

    switch (e.key) {
      case "ArrowLeft":
        newDate = addDays(focusedDate, -1);
        break;
      case "ArrowRight":
        newDate = addDays(focusedDate, 1);
        break;
      case "ArrowUp":
        newDate = addDays(focusedDate, -7);
        break;
      case "ArrowDown":
        newDate = addDays(focusedDate, 7);
        break;
      case "Enter":
      case " ":
        handleDayClick(focusedDate);
        return;
      default:
        return;
    }

    e.preventDefault();
    setFocusedDate(newDate);
    if (!isSameMonth(newDate, currentMonth)) {
      setCurrentMonth(newDate);
    }
  };

  // ✅ Format displayed value
  const getFormattedValue = () => {
    if (!selectedDate) return "";
    const dateToFormat = setMinutes(
      setHours(selectedDate, selectedHours),
      selectedMinutes,
    );
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZone: defaultTimezone,
      timeZoneName: "short",
      hour12: hourCycle === "h12",
    };
    const localeCode = (locale as any)?.code;
    return new Intl.DateTimeFormat(localeCode, options).format(dateToFormat);
  };

  return (
    <div className="relative w-fit" ref={containerRef}>
      {/* Input & Clear Button */}
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={getFormattedValue()}
          onClick={() => setIsOpen(!isOpen)}
          placeholder="Select a date and time"
          className="w-72 cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            onClick={() => onChange(null)}
            className="ml-2 rounded-md bg-blue-400 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-[320px] rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              &lt;
            </button>
            <span className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              &gt;
            </button>
          </div>

          {/* Week Days */}
          <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-gray-500">
            {daysOfWeek.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className="grid grid-cols-7 gap-1"
            role="grid"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {daysInMonth.map((day) => {
              const isSelected = selectedDate && isSameDay(selectedDate, day);
              const isFocused = focusedDate && isSameDay(focusedDate, day);
               
              const isBeforeMin = min ? day < new Date(min) : false;
              const isAfterMax = max ? day > new Date(max) : false;
              const isDisabled = isBeforeMin || isAfterMax;
              const isNotInMonth = !isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  role="gridcell"
                  onClick={() => handleDayClick(day)}
                  disabled={Boolean(isDisabled)}
                  ref={(el) => {
                    if (isFocused && el) el.focus();
                  }}
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    {
                      "bg-blue-500 text-white": isSelected,
                      "ring-2 ring-blue-400": isFocused && !isSelected,
                      "hover:bg-gray-100": !isSelected && !isDisabled,
                      "cursor-not-allowed text-gray-300": isDisabled,
                      "text-gray-400": isNotInMonth,
                    },
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Time Selectors */}
          <div className="mt-4 flex items-center justify-center border-t border-gray-200 pt-4">
            {/* Hours */}
            <select
              value={
                hourCycle === "h12"
                  ? selectedHours % 12 === 0
                    ? 12
                    : selectedHours % 12
                  : selectedHours
              }
              onChange={(e) => {
                const newDisplayHour = Number(e.target.value);
                let new24Hour = newDisplayHour;
                if (hourCycle === "h12") {
                  if (period === "PM" && newDisplayHour !== 12) new24Hour += 12;
                  else if (period === "AM" && newDisplayHour === 12)
                    new24Hour = 0;
                }
                handleTimeChange(new24Hour, selectedMinutes);
              }}
              className="mx-1 rounded-md border border-gray-300 py-1 px-2"
            >
              {displayHours.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}
                </option>
              ))}
            </select>

            <span className="mx-1 font-bold">:</span>

            {/* Minutes */}
            <select
              value={selectedMinutes}
              onChange={(e) =>
                handleTimeChange(selectedHours, Number(e.target.value))
              }
              className="mx-1 rounded-md border border-gray-300 py-1 px-2"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>

            {/* AM/PM */}
            {hourCycle === "h12" && (
              <select
                value={period}
                onChange={(e) => {
                  const newPeriod = e.target.value as "AM" | "PM";
                  setPeriod(newPeriod);
                  let new24Hour = selectedHours;
                  if (newPeriod === "PM" && selectedHours < 12) new24Hour += 12;
                  else if (newPeriod === "AM" && selectedHours >= 12)
                    new24Hour -= 12;
                  handleTimeChange(new24Hour, selectedMinutes);
                }}
                className="ml-2 rounded-md border border-gray-300 py-1 px-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
