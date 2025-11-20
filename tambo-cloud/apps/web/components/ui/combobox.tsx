"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

interface ComboboxProps<T extends string> {
  items: Array<ComboboxOption<T>>;
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  buttonClassName?: string;
  contentClassName?: string;
  renderRight?: (option: ComboboxOption<T>) => React.ReactNode;
}

export function Combobox<T extends string>({
  items,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  buttonClassName,
  contentClassName,
  renderRight,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = React.useMemo(
    () => items.find((i) => i.value === value),
    [items, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 font-normal",
            buttonClassName,
          )}
        >
          <span
            className={cn("truncate", !selectedItem && "text-muted-foreground")}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[--radix-popover-trigger-width] p-0",
          contentClassName,
        )}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((option) => {
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      renderRight && "flex items-center justify-between",
                    )}
                    onSelect={(currentValue) => {
                      const found = items.find((o) => o.value === currentValue);
                      if (found && !found.disabled) {
                        onChange(found.value);
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center min-w-0">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </div>
                    {renderRight ? renderRight(option) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
