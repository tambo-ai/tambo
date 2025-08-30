"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  subDays,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isValid,
  Locale,
} from "date-fns";

export const dateTimePickerPropsSchema = z.object({
  value: z.string().datetime().nullable().optional(),
  onChange: z.function().args(z.string().nullable()).returns(z.void()),
  timezone: z.string().optional(),
  min: z.string().datetime().optional(),
  max: z.string().datetime().optional(),
  stepMinutes: z.number().default(5),
  locale: z.any().optional(),
  hourCycle: z.enum(['h12', 'h24']).optional().default('h24'),
});

export type DateTimePickerProps = z.infer<typeof dateTimePickerPropsSchema> & {
  locale?: Locale;
};

/**
 * A component for picking a single date and time with various options.
 * @param {DateTimePickerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered date time picker component.
 */
export function DateTimePicker({
  value,
  onChange,
  timezone,
  min,
  max,
  stepMinutes = 5,
  locale,
  hourCycle = 'h24',
}: DateTimePickerProps) {
  const defaultTimezone = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const containerRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (isValid(date)) {
        setSelectedDate(date);
        setCurrentMonth(date);
        setSelectedHours(getHours(date));
        setSelectedMinutes(getMinutes(date));
        setPeriod(getHours(date) >= 12 ? 'PM' : 'AM');
      }
    } else {
      setSelectedDate(null);
    }
  }, [value, defaultTimezone]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    if (isOpen) {
      if (focusRef.current) {
        focusRef.current.focus();
      } else if (containerRef.current) {
        const firstFocusableButton = containerRef.current.querySelector(
          '.grid-cols-7 button:not([disabled])'
        ) as HTMLButtonElement | null;
        if (firstFocusableButton) {
          firstFocusableButton.focus();
        }
      }
    }
  }, [isOpen, currentMonth]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const displayHours = useMemo(() => {
    if (hourCycle === 'h12') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [hourCycle]);

  const minutes = useMemo(() => Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes), [stepMinutes]);
  const daysOfWeek = useMemo(() => {
    const start = new Date(2023, 0, 1);
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEEEEE', { locale }))
  }, [locale]);

  const emitValue = useCallback((date: Date | null, hours: number, minutes: number) => {
    if (!date) {
      onChange(null);
      return;
    }
    const finalDate = setMinutes(setHours(date, hours), minutes);
    onChange(finalDate.toISOString());
  }, [onChange]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const focusedButton = document.activeElement as HTMLButtonElement;
    if (!focusedButton || !focusedButton.dataset.date) return;

    e.preventDefault();
    const focusedDate = new Date(focusedButton.dataset.date);
    let newDate = focusedDate;

    switch (e.key) {
      case "ArrowUp": newDate = subDays(focusedDate, 7); break;
      case "ArrowDown": newDate = addDays(focusedDate, 7); break;
      case "ArrowLeft": newDate = subDays(focusedDate, 1); break;
      case "ArrowRight": newDate = addDays(focusedDate, 1); break;
      case "PageUp": setCurrentMonth(subMonths(currentMonth, 1)); return;
      case "PageDown": setCurrentMonth(addMonths(currentMonth, 1)); return;
      case "Home": newDate = startOfMonth(focusedDate); break;
      case "End": newDate = endOfMonth(focusedDate); break;
      case "Enter": case " ": handleDayClick(focusedDate); return;
      case "Escape": setIsOpen(false); return;
      default: return;
    }

    if (!isSameMonth(newDate, currentMonth)) {
      setCurrentMonth(newDate);
    }

    setTimeout(() => {
      const newButtonSelector = `button[data-date="${newDate.toISOString()}"]`;
      const newButton = containerRef.current?.querySelector(newButtonSelector) as HTMLButtonElement | null;
      if (newButton) {
        newButton.focus();
      }
    }, 0);
  };

  const getFormattedValue = () => {
    if (!selectedDate) return "";
    const dateToFormat = setMinutes(setHours(selectedDate, selectedHours), selectedMinutes);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: defaultTimezone,
      timeZoneName: 'short',
      hour12: hourCycle === 'h12',
    };
    const localeCode = (locale as any)?.code;
    return new Intl.DateTimeFormat(localeCode, options).format(dateToFormat);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={getFormattedValue()}
          onClick={() => setIsOpen(!isOpen)}
          placeholder="Select a date and time"
          className="form-input border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        {value && (
          <button onClick={() => onChange(null)} className="ml-2 px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <div
          onKeyDown={handleKeyDown}
          className="absolute z-10 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
            <span className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy", { locale })}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
          </div>

          <div className="grid grid-cols-7 text-center font-medium text-gray-500 mb-2">
            {daysOfWeek.map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const isSelected = selectedDate && isSameDay(selectedDate, day);
              const isDisabled = !!((min && day < new Date(min)) || (max && day > new Date(max)));
              return (
                <button
                  key={day.toISOString()}
                  data-date={day.toISOString()}
                  ref={isSelected ? focusRef : null}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  aria-selected={!!isSelected}
                  className={`w-10 h-10 rounded-full ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100"} ${isDisabled ? "cursor-not-allowed text-gray-300" : ""} ${!isSameMonth(day, currentMonth) ? "text-gray-400" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center items-center mt-4">
            <select
              // THIS IS THE ONLY LINE THAT HAS BEEN CHANGED
              value={hourCycle === 'h12' ? (selectedHours % 12 === 0 ? 12 : selectedHours % 12) : selectedHours}
              onChange={(e) => {
                const newDisplayHour = Number(e.target.value);
                let new24Hour = newDisplayHour;
                if (hourCycle === 'h12') {
                  if (period === 'PM' && newDisplayHour !== 12) new24Hour += 12;
                  else if (period === 'AM' && newDisplayHour === 12) new24Hour = 0;
                }
                handleTimeChange(new24Hour, selectedMinutes);
              }}
              className="border rounded-md py-1 px-2"
            >
              {displayHours.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}</option>)}
            </select>
            <span className="mx-1 font-bold">:</span>
            <select
              value={selectedMinutes}
              onChange={(e) => handleTimeChange(selectedHours, Number(e.target.value))}
              className="border rounded-md py-1 px-2"
            >
              {minutes.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
            </select>
            {hourCycle === 'h12' && (
              <select
                value={period}
                onChange={(e) => {
                  const newPeriod = e.target.value as 'AM' | 'PM';
                  setPeriod(newPeriod);
                  let new24Hour = selectedHours;
                  if (newPeriod === 'PM' && selectedHours < 12) new24Hour += 12;
                  else if (newPeriod === 'AM' && selectedHours >= 12) new24Hour -= 12;
                  handleTimeChange(new24Hour, selectedMinutes);
                }}
                className="border rounded-md py-1 px-2 ml-2"
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