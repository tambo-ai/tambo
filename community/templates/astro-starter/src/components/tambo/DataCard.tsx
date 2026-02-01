"use client";

import { memo } from "react";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Loader2 } from "lucide-react";

interface DataCardItem {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
}

interface DataCardProps {
  title?: string;
  items: DataCardItem[];
  variant?: "default" | "grid" | "list";
}

/**
 * A component to display data points, statistics, or key-value pairs in a card format.
 * Can render as a single card, a grid of cards, or a list.
 */
export const DataCard = memo(function DataCard({
  title,
  items,
  variant = "grid",
}: DataCardProps) {
  const { streamStatus } = useTamboStreamStatus();

  const hasData = items && items.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center p-6 bg-white border border-zinc-200 rounded-xl min-h-[120px]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const renderItem = (item: DataCardItem, index: number) => {
    return (
      <div
        key={index}
        className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex flex-col gap-1"
      >
        <dt className="text-sm font-medium text-zinc-500">{item.label}</dt>
        <dd className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-zinc-900">
            {item.value}
          </span>
          {item.trend && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                item.trend.direction === "up"
                  ? "bg-green-100 text-green-700"
                  : item.trend.direction === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {item.trend.direction === "up"
                ? "↑"
                : item.trend.direction === "down"
                  ? "↓"
                  : "→"}{" "}
              {item.trend.value}%
            </span>
          )}
        </dd>
        {item.description && (
          <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
        )}
      </div>
    );
  };

  const containerClasses = {
    default: "space-y-4",
    grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    list: "flex flex-col gap-2",
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-xl p-6">
      {title && (
        <h3 className="text-base font-semibold text-zinc-900 mb-4">{title}</h3>
      )}
      <dl className={containerClasses[variant]}>
        {items.map((item, i) => renderItem(item, i))}
      </dl>
    </div>
  );
});
