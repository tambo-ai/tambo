import { Slot } from "@radix-ui/react-slot";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import {
  type Field,
  type InputFieldsState,
  InputFieldsRootContext,
} from "./input-fields-context";

export type InputFieldsRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Array of field configurations to render. */
    fields: Field[];
  }
>;

/**
 * Root component for the InputFields compound component.
 * Manages Tambo component state, validates fields, and provides context
 * for child sub-components.
 * @returns The root container element with context provider, or null if state is not yet initialized
 */
export const InputFieldsRoot = React.forwardRef<
  HTMLDivElement,
  InputFieldsRootProps
>(function InputFieldsRoot({ asChild, children, fields = [], ...props }, ref) {
  const { isIdle } = useTambo();
  const isGenerating = !isIdle;

  const baseId = React.useId();
  const inputFieldsId = React.useMemo(() => {
    const ids = (fields ?? [])
      .map((f) => f.id)
      .filter(Boolean)
      .join("-");
    return ids ? `input-fields-${baseId}-${ids}` : `input-fields-${baseId}`;
  }, [baseId, fields]);

  const [state, setState] = useTamboComponentState<InputFieldsState>(
    inputFieldsId,
    {
      values: {},
    },
  );

  const validFields = React.useMemo(() => {
    return fields.filter((field): field is Field => {
      if (!field || typeof field !== "object") {
        console.warn("Invalid field object detected");
        return false;
      }
      if (!field.id || typeof field.id !== "string") {
        console.warn("Field missing required id property");
        return false;
      }
      return true;
    });
  }, [fields]);

  const handleInputChange = React.useCallback(
    (fieldId: string, value: string) => {
      if (!state) return;
      setState({
        ...state,
        values: {
          ...state.values,
          [fieldId]: value,
        },
      });
    },
    [state, setState],
  );

  const contextValue = React.useMemo(
    () => ({
      validFields,
      values: state?.values ?? {},
      isGenerating,
      handleInputChange,
    }),
    [validFields, state?.values, isGenerating, handleInputChange],
  );

  if (!state) return null;

  const Comp = asChild ? Slot : "div";

  return (
    <InputFieldsRootContext.Provider value={contextValue}>
      <Comp ref={ref} data-slot="input-fields-root" {...props}>
        {children}
      </Comp>
    </InputFieldsRootContext.Provider>
  );
});
