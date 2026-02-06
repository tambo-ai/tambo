import { Slot } from "@radix-ui/react-slot";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import {
  FormFieldDefinition,
  FormRootContext,
  FormState,
} from "./form-root-context";

export type FormRootProps = BaseProps<
  React.HTMLAttributes<HTMLFormElement> & {
    /** Array of form fields to display. */
    fields: FormFieldDefinition[];
    /** Callback function called when the form is submitted with form data as argument. */
    onSubmit: (data: Record<string, string>) => void;
    /** Optional error message to display. */
    errorMessage?: string;
    /** Text to display on the submit button. */
    submitText?: string;
  }
>;

/**
 * Root primitive for a form component.
 * Provides context with form state management for child components.
 * Handles field validation, dropdown state, selections, and form submission.
 * @returns The rendered form element with context provider, or null if state is not initialized
 */
export const FormRoot = React.forwardRef<HTMLFormElement, FormRootProps>(
  function FormRoot(
    {
      children,
      fields = [],
      onSubmit,
      errorMessage,
      submitText = "Submit",
      asChild,
      ...props
    },
    ref,
  ) {
    const { isIdle } = useTambo();
    const isGenerating = !isIdle;

    const baseId = React.useId();
    const formId = React.useMemo(() => {
      const ids = (fields ?? [])
        .map((f) => f.id)
        .filter(Boolean)
        .join("-");
      return ids ? `form-${baseId}-${ids}` : `form-${baseId}`;
    }, [baseId, fields]);

    const [state, setState] = useTamboComponentState<FormState>(formId, {
      values: {},
      openDropdowns: {},
      selectedValues: {},
      yesNoSelections: {},
      checkboxSelections: {},
    });

    const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>(
      {},
    );

    const validFields = React.useMemo(() => {
      return fields.filter((field): field is FormFieldDefinition => {
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

    const handleSubmit = React.useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(
          Array.from(formData.entries()).map(([k, v]) => [k, v.toString()]),
        );
        onSubmit(data);
      },
      [onSubmit],
    );

    const handleDropdownToggle = React.useCallback(
      (fieldId: string) => {
        if (!state) return;
        setState({
          ...state,
          openDropdowns: {
            ...state.openDropdowns,
            [fieldId]: !state.openDropdowns[fieldId],
          },
        });
      },
      [state, setState],
    );

    const handleOptionSelect = React.useCallback(
      (fieldId: string, option: string) => {
        if (!state) return;
        setState({
          ...state,
          selectedValues: {
            ...state.selectedValues,
            [fieldId]: option,
          },
          openDropdowns: {
            ...state.openDropdowns,
            [fieldId]: false,
          },
        });
      },
      [state, setState],
    );

    const handleYesNoSelection = React.useCallback(
      (fieldId: string, value: string) => {
        if (!state) return;
        setState({
          ...state,
          yesNoSelections: {
            ...state.yesNoSelections,
            [fieldId]: value,
          },
          values: {
            ...state.values,
            [fieldId]: value,
          },
        });
      },
      [state, setState],
    );

    const handleCheckboxChange = React.useCallback(
      (fieldId: string, option: string, checked: boolean) => {
        if (!state) return;

        const currentSelections = state.checkboxSelections[fieldId] ?? [];

        const newSelections = checked
          ? [...currentSelections, option]
          : currentSelections.filter((item) => item !== option);

        setState({
          ...state,
          checkboxSelections: {
            ...state.checkboxSelections,
            [fieldId]: newSelections,
          },
          values: {
            ...state.values,
            [fieldId]: newSelections.join(","),
          },
        });
      },
      [state, setState],
    );

    const handleSliderChange = React.useCallback(
      (fieldId: string, value: string, field: FormFieldDefinition) => {
        if (!state) return;

        const label =
          field.sliderLabels && field.sliderLabels.length > 0
            ? field.sliderLabels[parseInt(value)]
            : value;

        setState({
          ...state,
          values: {
            ...state.values,
            [fieldId]: `${value} : ${label}`,
          },
        });
      },
      [state, setState],
    );

    const getDefaultSliderValue = React.useCallback(
      (field: FormFieldDefinition): string => {
        const defaultVal =
          field.sliderDefault?.toString() ??
          (field.sliderLabels && field.sliderLabels.length > 0
            ? Math.floor((field.sliderLabels.length - 1) / 2).toString()
            : "5");

        const defaultLabel =
          field.sliderLabels && field.sliderLabels.length > 0
            ? field.sliderLabels[parseInt(defaultVal)]
            : defaultVal;

        return `${defaultVal} : ${defaultLabel}`;
      },
      [],
    );

    /**
     * Keeps track of latest state for event handlers.
     */
    const stateRef = React.useRef(state);
    React.useEffect(() => {
      stateRef.current = state;
    }, [state]);

    /**
     * Handles closing dropdowns when clicking outside their containing elements.
     */
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        Object.entries(dropdownRefs.current).forEach(([fieldId, ref]) => {
          if (ref && !ref.contains(event.target as Node) && stateRef.current) {
            setState({
              ...stateRef.current,
              openDropdowns: {
                ...stateRef.current.openDropdowns,
                [fieldId]: false,
              },
            });
          }
        });
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [setState]);

    const contextValue = React.useMemo(
      () => ({
        state: state as FormState,
        setState,
        validFields,
        isGenerating,
        errorMessage,
        submitText,
        dropdownRefs: dropdownRefs as React.RefObject<
          Record<string, HTMLDivElement | null>
        >,
        handleSubmit,
        handleDropdownToggle,
        handleOptionSelect,
        handleYesNoSelection,
        handleCheckboxChange,
        handleSliderChange,
        getDefaultSliderValue,
      }),
      [
        state,
        setState,
        validFields,
        isGenerating,
        errorMessage,
        submitText,
        handleSubmit,
        handleDropdownToggle,
        handleOptionSelect,
        handleYesNoSelection,
        handleCheckboxChange,
        handleSliderChange,
        getDefaultSliderValue,
      ],
    );

    if (!state) return null;

    const Comp = asChild ? Slot : "form";

    return (
      <FormRootContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          data-slot="form-root"
          onSubmit={handleSubmit}
          {...props}
        >
          {children}
        </Comp>
      </FormRootContext.Provider>
    );
  },
);
