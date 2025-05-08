import { cn } from "@/lib/utils";
import * as React from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "span";
    return (
      <Comp
        ref={ref}
        className={cn(
          "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0",
          "[clip:rect(0,0,0,0)]",
          className,
        )}
        {...props}
      />
    );
  },
);
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
