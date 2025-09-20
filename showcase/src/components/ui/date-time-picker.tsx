"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { format, setHours, setMinutes, type Locale } from "date-fns"; // Changed
import { Calendar as CalendarIcon, Clock, X, Loader2Icon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import * as React from "react";
import "react-day-picker/dist/style.css";

const dateTimeVariants = cva("w-full rounded-lg transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-background border border-border",
      outline: [
        "border-2 border-border",
        "hover:border-primary/50 focus-within:border-primary",
      ].join(" "),
      ghost: [
        "border-0 bg-transparent",
        "hover:bg-muted/50 focus-within:bg-muted/30",
      ].join(" "),
    },
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const combineDateAndTime = (datePart: Date, timePart: string): Date => {
  const [hours, minutes] = timePart.split(":").map(Number);
  let newDate = setHours(datePart, hours);
  newDate = setMinutes(newDate, minutes);
  return newDate;
};

export interface DateTimeState {
  selectedDate?: Date;
  selectedTime: string;
  isCalendarOpen: boolean;
  value: string | null;
}

export interface DateTimeProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      "onChange" | "onSubmit" | "onFocus" | "onBlur"
    >,
    VariantProps<typeof dateTimeVariants> {
  value?: string | null;
  onChange?: (value: string | null) => void;
  onSubmit?: (value: string | null) => void;
  locale?: Locale; // FIX 1: Changed 'any' to 'Locale'
  stepMinutes?: number;
  showSubmitButton?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  label?: string;
  description?: string;
  required?: boolean;
  showTime?: boolean;
  timeFormat?: "12h" | "24h";
  dateFormat?: string;
  showWeekNumbers?: boolean;
  showToday?: boolean;
  allowClear?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const DateTimeComponent = React.forwardRef<
  HTMLDivElement,
  DateTimeProps
>(
  (
    {
      className,
      variant,
      size,
      value = null,
      onChange,
      locale,
      stepMinutes = 1, // FIX 2: Removed unused 'hourCycle'
      showSubmitButton = false,
      onSubmit,
      placeholder = "Pick a date and time",
      disabled = false,
      min,
      max,
      label,
      description,
      required = false,
      showTime = true,
      timeFormat = "12h",
      dateFormat = "MM/dd/yyyy",
      showWeekNumbers = false,
      showToday = true,
      allowClear = true,
      onFocus, // FIX 3: Removed unused 'timezone'
      onBlur,
      ...props
    },
    ref,
  ) => {
    const { isIdle, sendThreadMessage } = useTambo();
    const isGenerating = !isIdle;

    const componentId = React.useMemo(() => {
      return `datetime-${Date.now()}`;
    }, []);

    const [state, setState] = useTamboComponentState<DateTimeState>(
      componentId,
      {
        selectedDate:
          value && !isNaN(new Date(value).getTime())
            ? new Date(value)
            : undefined,
        selectedTime:
          value && !isNaN(new Date(value).getTime())
            ? format(new Date(value), "HH:mm")
            : "09:00",
        isCalendarOpen: false,
        value,
      },
    );

    React.useEffect(() => {
      if (value !== state?.value) {
        const isValidDate = value && !isNaN(new Date(value).getTime());
        setState({
          selectedDate: isValidDate ? new Date(value) : undefined,
          selectedTime: isValidDate
            ? format(new Date(value), "HH:mm")
            : "09:00",
          isCalendarOpen: false,
          value: isValidDate ? value : null,
        });
      }
    }, [value, setState, state?.value]);

    React.useEffect(() => {
      if (!state) return;

      if (state.selectedDate) {
        const combined = combineDateAndTime(
          state.selectedDate,
          state.selectedTime,
        );
        const isoValue = combined.toISOString();
        if (isoValue !== state.value) {
          setState({
            ...state,
            value: isoValue,
          });
          if (typeof onChange === "function") {
            onChange(isoValue);
          }
        }
      } else if (state.value !== null) {
        setState({
          ...state,
          value: null,
        });
        if (typeof onChange === "function") {
          onChange(null);
        }
      }
    }, [state?.selectedDate, state?.selectedTime, onChange, setState]);

    if (!state) return null;

    const handleDateSelect = (date: Date | undefined) => {
      if (!date) return;

      const combined = combineDateAndTime(date, state.selectedTime);
      const isoValue = combined.toISOString();

      setState({
        ...state,
        selectedDate: date,
        value: isoValue,
        isCalendarOpen: false,
      });

      if (onChange) {
        onChange(isoValue);
      }

      const formattedDate = format(combined, "MMMM d, yyyy 'at' h:mm a");
      sendThreadMessage(`I've selected: ${formattedDate}`);
    };

    const handleClear = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setState({
        ...state,
        selectedDate: undefined,
        selectedTime: "09:00",
        value: null,
      });
    };

    const handleTimeChange = (newTime: string) => {
      setState({
        ...state,
        selectedTime: newTime,
      });
    };

    const handleCalendarToggle = () => {
      if (disabled) return;
      setState({
        ...state,
        isCalendarOpen: !state.isCalendarOpen,
      });
      if (!state.isCalendarOpen) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    };

    const handleSubmit = () => {
      if (state.value) {
        const formattedDate = format(
          new Date(state.value),
          "MMMM d, yyyy 'at' h:mm a",
        );
        sendThreadMessage(`I've selected: ${formattedDate}`);
      }
      onSubmit?.(state.value);
      setState({
        ...state,
        isCalendarOpen: false,
      });
    };

    const formattedDisplayDate = state.selectedDate
      ? format(
          combineDateAndTime(state.selectedDate, state.selectedTime),
          showTime
            ? timeFormat === "12h"
              ? `${dateFormat} h:mm a`
              : `${dateFormat} HH:mm`
            : dateFormat,
          { locale },
        )
      : placeholder;

    const minDate = min ? new Date(min) : undefined;
    const maxDate = max ? new Date(max) : undefined;

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className="block text-sm font-medium text-primary">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {description && <p className="text-sm text-secondary">{description}</p>}

        <div className="relative">
          <button
            onClick={handleCalendarToggle}
            disabled={disabled ?? isGenerating}
            className={cn(
              dateTimeVariants({ variant, size }),
              "flex items-center justify-between w-full px-4 py-2 font-medium",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring",
              "disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground",
              "transition-colors duration-200",
              size === "sm" && "px-3 py-1.5",
              size === "lg" && "px-5 py-3",
            )}
          >
            <span
              className={
                state.selectedDate ? "text-foreground" : "text-muted-foreground"
              }
            >
              {isGenerating ? "Updating..." : formattedDisplayDate}
            </span>
            <div className="flex items-center gap-1">
              {isGenerating ? (
                <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {state.selectedDate && allowClear && (
                    <X
                      className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      onClick={handleClear}
                    />
                  )}
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                </>
              )}
            </div>
          </button>

          {state.isCalendarOpen && !disabled && !isGenerating && (
            <div className="absolute z-10 p-4 mt-2 bg-background border rounded-lg shadow-lg min-w-[320px] border-border">
              <DayPicker
                mode="single"
                selected={state.selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={locale}
                fromDate={minDate}
                toDate={maxDate}
                showWeekNumber={showWeekNumbers}
                today={showToday ? new Date() : undefined}
                className="rdp-custom"
              />

              {showTime && (
                <div className="flex items-center justify-center pt-4 border-t border-border gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={state.selectedTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    step={stepMinutes * 60}
                    className="px-2 py-1 text-sm border rounded-md border-border 
                                       bg-background text-foreground
                                       focus:ring-2 focus:ring-ring focus:border-input
                                       transition-colors duration-200"
                  />
                </div>
              )}

              {showSubmitButton && onSubmit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!state.value}
                    className="w-full px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md 
                                       hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed
                                       disabled:text-muted-foreground transition-colors duration-200"
                  >
                    Submit
                  </button>
                </div>
              )}

              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => setState({ ...state, isCalendarOpen: false })}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                {state.selectedDate && allowClear && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

DateTimeComponent.displayName = "DateTime";

export { dateTimeVariants };
