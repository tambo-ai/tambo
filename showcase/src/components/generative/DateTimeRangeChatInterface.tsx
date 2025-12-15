"use client";

import { MessageThreadFull } from "@/components//tambo/message-thread-full";
import {
  DateTimeRangePicker,
  dateTimeRangePickerSchema,
} from "@/components/ui/datetime-range-picker";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const DateTimeRangePickerChatInterface = () => {
  const userContextKey = useUserContextKey("datetime-range-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "DateTimeRangePicker",
      description: `
      A versatile and customizable Date-Time Range Picker component.
      
      Features:
      - Select start and end date-time values
      - Built-in quick presets (Today, Yesterday, Last 7 days, etc.)
      - Timezone support
      - Max range restriction (e.g., cannot select more than 30 days)
      - Disable past or future ranges
      - Multiple visual variants (default, bordered, solid)
      - Accessible keyboard navigation
      - Smart validation for invalid ranges (end before start)
      - Ideal for analytics dashboards, logs filtering, booking systems, reports, calendars, etc.

      Example use cases:
      - Analytics dashboards (“Show data for last 30 days”)
      - Filtering logs by date-time
      - Booking/reservation date selection
      - Reports & admin panels
      `,
      component: DateTimeRangePicker,
      propsSchema: dateTimeRangePickerSchema,
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull
        contextKey={userContextKey}
        className="rounded-lg flex-1"
      />
    </div>
  );
};
