"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  className?: string;
  onPeriodChange?: (period: string) => void;
  defaultPeriod?: string;
  periodOptions?: { value: string; label: string }[];
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  value,
  className,
  onPeriodChange,
  defaultPeriod = "",
  periodOptions = [],
  isLoading = false,
}: DashboardCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <Card
      className={cn(
        "border rounded-2xl overflow-hidden w-full",
        "h-20 md:h-40",
        className,
      )}
    >
      <CardContent className="p-3 md:p-6 h-full">
        <div className="flex md:block items-center justify-between h-full md:space-y-4">
          <h3 className="text-xs md:text-sm font-medium text-foreground">
            {title}
          </h3>
          <div className="flex items-center md:items-end space-x-2">
            {isLoading ? (
              <div className="text-foreground">
                <div className="h-8 w-16 md:h-16 md:w-24 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <div className="text-2xl md:text-6xl font-semibold md:font-normal text-foreground">
                {typeof value === "number" ? value.toLocaleString() : value}
              </div>
            )}
            {periodOptions.length > 0 && (
              <Select
                value={selectedPeriod}
                onValueChange={(value) => handlePeriodChange(value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-auto h-6 md:h-8 px-2 md:px-3 text-xs md:text-sm text-foreground border-0 bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0 disabled:opacity-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer text-xs md:text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
