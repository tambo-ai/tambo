import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import * as React from "react";
import { Input } from "./input";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "rounded";
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, variant = "default", containerClassName, ...props }, ref) => {
    const isRounded = variant === "rounded";

    return (
      <div
        className={cn(
          "relative",
          isRounded ? "flex items-center flex-1 max-w-xl" : "",
          containerClassName,
        )}
      >
        <Search
          className={cn(
            "absolute h-4 w-4 text-muted-foreground",
            isRounded
              ? "left-3 top-1/2 transform -translate-y-1/2"
              : "left-2 top-2.5",
          )}
        />
        <Input
          ref={ref}
          className={cn(
            isRounded ? "pl-9 rounded-full w-full" : "pl-8",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
