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
}

export function DashboardCard({
  title,
  value,
  className,
  onPeriodChange,
  defaultPeriod = "",
  periodOptions = [],
}: DashboardCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <Card
      className={cn(
        "border rounded-2xl overflow-hidden h-40 w-full",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <div className="flex items-end space-x-2">
            <div className="text-6xl text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {periodOptions.length > 0 && (
              <Select
                value={selectedPeriod}
                onValueChange={(value) => handlePeriodChange(value)}
              >
                <SelectTrigger className="w-auto h-8 px-3 text-sm text-foreground border-0 bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
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
