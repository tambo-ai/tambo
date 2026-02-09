import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { useFormRootContext } from "../root/form-root-context";

export type FormErrorProps = BaseProps<React.HTMLAttributes<HTMLDivElement>>;

/**
 * Error primitive for displaying form-level errors.
 * Only renders when an error message is present in the form context.
 * @returns The rendered error element, or null if no error exists
 */
export const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  function FormError({ asChild, children, ...props }, ref) {
    const { errorMessage } = useFormRootContext();

    if (!errorMessage) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <Comp ref={ref} data-slot="form-error" {...props}>
        {children ?? <p>{errorMessage}</p>}
      </Comp>
    );
  },
);
