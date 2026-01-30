import * as React from "react";
import { Check } from "lucide-react";
import { useTamboComponentState } from "@tambo-ai/react";
import { cn } from "@/lib/utils";

import type {
  DataCardProps,
  DataCardState,
} from "@/lib/card-data.schema";

export const DataCard = React.forwardRef<
  HTMLDivElement,
  DataCardProps & React.HTMLAttributes<HTMLDivElement>
>(({ title, options, className, ...props }, ref) => {
  const [state, setState] = useTamboComponentState<DataCardState>(
    "data-card",
    { selectedValues: [] },
  );

  const handleToggleCard = (value: string) => {
    if (!state) return;

    const selectedValues = state.selectedValues.includes(value)
      ? state.selectedValues.filter((v) => v !== value)
      : [...state.selectedValues, value];

    setState({ selectedValues });
  };

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {title && (
        <h2 className="text-lg font-medium text-gray-700 mb-3">
          {title}
        </h2>
      )}

      <div className="space-y-2">
        {options.map((card) => {
          const selected =
            state?.selectedValues.includes(card.value);

          return (
            <div key={card.id} className="border-b pb-2 last:border-0">
              <div
                className={cn(
                  "flex gap-3 p-2 rounded-md cursor-pointer",
                  selected && "bg-gray-50",
                )}
                onClick={() => handleToggleCard(card.value)}
              >
                <div
                  className={cn(
                    "w-4 h-4 border rounded-sm flex items-center justify-center",
                    selected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300",
                  )}
                >
                  {selected && <Check className="w-3 h-3" />}
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-600">
                    {card.label}
                  </h3>
                  {card.description && (
                    <p className="text-xs text-gray-500">
                      {card.description}
                    </p>
                  )}
                  {card.url && (
                    <span className="text-xs text-green-600 truncate block">
                      {card.url}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DataCard.displayName = "DataCard";

export default DataCard;
