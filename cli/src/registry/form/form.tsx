"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboComponentState } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

const formVariants = cva("w-full rounded-lg transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-background border border-border",
      solid: [
        "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20",
        "bg-background border border-border",
      ].join(" "),
      bordered: ["border-2", "border-border"].join(" "),
    },
    layout: {
      default: "space-y-4",
      compact: "space-y-2",
      relaxed: "space-y-6",
    },
  },
  defaultVariants: {
    variant: "default",
    layout: "default",
  },
});

/**
 * Represents a field in a form component
 * @property {string} id - Unique identifier for the field
 * @property {'text' | 'number' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'slider' | 'yes-no'} type - Type of form field
 * @property {string} label - Display label for the field
 * @property {string} [placeholder] - Optional placeholder text
 * @property {string[]} [options] - Options for select fields
 * @property {boolean} [required] - Whether the field is required
 * @property {string} [description] - Additional description text for the field
 * @property {number} [sliderMin] - The minimum value for slider fields
 * @property {number} [sliderMax] - The maximum value for slider fields
 * @property {number} [sliderStep] - The step value for slider fields
 * @property {number} [sliderDefault] - Default value for slider fields
 * @property {string[]} [sliderLabels] - Labels to display under slider (typically at min, middle, max positions)
 */
export interface FormField {
  /**
   * The unique identifier for the field
   */
  id: string;
  /**
   * The type of form field
   */
  type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "radio"
    | "checkbox"
    | "slider"
    | "yes-no";
  /**
   * The display label for the field
   */
  label: string;
  /**
   * The placeholder text for the field
   */
  placeholder?: string;
  /**
   * The options for select fields
   */
  options?: string[];
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * The description text for the field
   */
  description?: string;
  /**
   * The minimum value for slider fields
   */
  sliderMin?: number;
  /**
   * The maximum value for slider fields
   */
  sliderMax?: number;
  /**
   * The step value for slider fields
   */
  sliderStep?: number;
  /**
   * Default value for slider fields
   */
  sliderDefault?: number;
  /**
   * Labels to display under slider (typically at min, middle, max positions)
   */
  sliderLabels?: string[];
}

export interface FormState {
  values: Record<string, string>;
  openDropdowns: Record<string, boolean>;
  selectedValues: Record<string, string>;
  yesNoSelections: Record<string, string>;
  checkboxSelections: Record<string, string[]>;
}

/**
 * Props for the Form component
 * @interface
 */
export interface FormProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit" | "onError">,
    VariantProps<typeof formVariants> {
  /** Array of form fields to display */
  fields: FormField[];
  /** Callback function called when the form is submitted */
  onSubmit: (data: Record<string, string>) => void;
  /** Optional error message to display */
  onError?: string;
  /** Text to display on the submit button (default: "Submit") */
  submitText?: string;
}

/**
 * A flexible form component that supports various field types and layouts
 * @component
 * @example
 * ```tsx
 * <Form
 *   fields={[
 *     {
 *       id: "name",
 *       type: "text",
 *       label: "Name",
 *       required: true
 *     },
 *     {
 *       id: "age",
 *       type: "number",
 *       label: "Age"
 *     }
 *   ]}
 *   onSubmit={(data) => console.log(data)}
 *   variant="solid"
 *   layout="compact"
 *   className="custom-styles"
 * />
 * ```
 */
export const FormComponent = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      variant,
      layout,
      fields = [],
      onSubmit,
      onError,
      submitText = "Submit",
      ...props
    },
    ref,
  ) => {
    const { isIdle } = useTambo();
    const isGenerating = !isIdle;

    /**
     * Generates a unique identifier for the form based on field IDs
     * This ensures persistence of state between re-renders
     */
    const formId = React.useMemo(() => {
      try {
        // Safely create a form ID, handling any potential issues with fields
        const validFields = fields.filter(
          (f) => f && typeof f === "object" && f.id,
        );
        return `form-${validFields.map((f) => f.id).join("-")}`;
      } catch (err) {
        console.error("Error generating form ID:", err);
        return `form-${Date.now()}`;
      }
    }, [fields]);

    /**
     * Component state managed by Tambo
     * Stores all form values, dropdown states, selections, and other UI state
     */
    const [state, setState] = useTamboComponentState<FormState>(formId, {
      values: {},
      openDropdowns: {},
      selectedValues: {},
      yesNoSelections: {},
      checkboxSelections: {},
    });

    /**
     * References to dropdown DOM elements for handling click-outside behavior
     */
    const dropdownRefs = React.useRef<Record<string, HTMLDivElement | null>>(
      {},
    );

    /**
     * Filtered list of valid form fields
     * Removes any fields with missing/invalid data and provides type safety
     */
    const validFields = React.useMemo(() => {
      return fields.filter((field): field is FormField => {
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

    /**
     * Handles form submission
     * @param {React.FormEvent} e - The form submission event
     */
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(
        Array.from(formData.entries()).map(([k, v]) => [k, v.toString()]),
      );
      onSubmit(data);
    };

    /**
     * Handles dropdown toggle events
     * @param {string} fieldId - The ID of the dropdown field
     */
    const handleDropdownToggle = (fieldId: string) => {
      if (!state) return;
      setState({
        ...state,
        openDropdowns: {
          ...state.openDropdowns,
          [fieldId]: !state.openDropdowns[fieldId],
        },
      });
    };

    /**
     * Handles selection from dropdown options
     * @param {string} fieldId - The ID of the dropdown field
     * @param {string} option - The selected option value
     */
    const handleOptionSelect = (fieldId: string, option: string) => {
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
    };

    /**
     * Handles yes/no selection for yes-no field type
     * @param {string} fieldId - The ID of the yes-no field
     * @param {string} value - The selected value ("Yes" or "No")
     */
    const handleYesNoSelection = (fieldId: string, value: string) => {
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
    };

    /**
     * Handles checkbox selection changes
     * @param {string} fieldId - The ID of the field being updated
     * @param {string} option - The option value that was clicked
     * @param {boolean} checked - Whether the checkbox is now checked
     */
    const handleCheckboxChange = (
      fieldId: string,
      option: string,
      checked: boolean,
    ) => {
      if (!state) return;

      // Get current selections or initialize empty array
      const currentSelections = state.checkboxSelections[fieldId] ?? [];

      // Update selections based on checked state
      let newSelections: string[];
      if (checked) {
        newSelections = [...currentSelections, option];
      } else {
        newSelections = currentSelections.filter((item) => item !== option);
      }

      // Update state with new selections
      setState({
        ...state,
        checkboxSelections: {
          ...state.checkboxSelections,
          [fieldId]: newSelections,
        },
        // Also update values with comma-separated string for form submission
        values: {
          ...state.values,
          [fieldId]: newSelections.join(","),
        },
      });
    };

    /**
     * Handles slider value changes
     * @param {string} fieldId - The ID of the slider field
     * @param {string} value - The new slider value
     * @param {FormField} field - The field definition with possible labels
     */
    const handleSliderChange = (
      fieldId: string,
      value: string,
      field: FormField,
    ) => {
      if (!state) return;

      // Format the display value
      const label =
        field.sliderLabels && field.sliderLabels.length > 0
          ? field.sliderLabels[parseInt(value)]
          : value;

      // Store as "value : label" format
      setState({
        ...state,
        values: {
          ...state.values,
          [fieldId]: `${value} : ${label}`,
        },
      });
    };

    /**
     * Calculates the default value for a slider field
     * @param {FormField} field - The slider field to generate a default value for
     * @returns {string} The formatted default value in "value : label" format
     */
    const getDefaultSliderValue = (field: FormField): string => {
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
    };

    /**
     * Keeps track of latest state for event handlers
     */
    const stateRef = React.useRef(state);
    React.useEffect(() => {
      stateRef.current = state;
    }, [state]);

    /**
     * Handles closing dropdowns when clicking outside their containing elements
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

    if (!state) return null;

    return (
      <form
        ref={ref}
        className={cn(formVariants({ variant, layout }), className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <div className="p-6 space-y-6">
          {onError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{onError}</p>
            </div>
          )}

          {validFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label
                className="block text-sm font-medium text-primary"
                htmlFor={field.id}
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.description && (
                <p className="text-sm text-secondary">{field.description}</p>
              )}

              {field.type === "text" && (
                <input
                  type="text"
                  id={field.id}
                  name={field.id}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 rounded-lg 
                            bg-background border border-border
                            focus:ring-2 focus:ring-ring focus:border-input
                            placeholder:text-muted-foreground
                            transition-colors duration-200"
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  id={field.id}
                  name={field.id}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 rounded-lg
                            bg-background border border-border
                            focus:ring-2 focus:ring-ring focus:border-input
                            placeholder:text-muted-foreground
                            transition-colors duration-200"
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  id={field.id}
                  name={field.id}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg
                            bg-background border border-border
                            focus:ring-2 focus:ring-ring focus:border-input
                            placeholder:text-muted-foreground
                            transition-colors duration-200 resize-y"
                />
              )}

              {field.type === "select" && field.options && (
                <div
                  className="relative"
                  ref={(el) => {
                    dropdownRefs.current[field.id] = el;
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle(field.id)}
                    className="w-full px-3 py-2 rounded-lg border border-border
                              bg-background text-foreground
                              focus:ring-2 focus:ring-ring focus:border-input
                              hover:bg-muted/50
                              transition-colors duration-200
                              text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        state.selectedValues[field.id]
                          ? "text-foreground"
                          : "text-secondary"
                      }
                    >
                      {state.selectedValues[field.id] ?? field.placeholder}
                    </span>
                    <svg
                      className={cn(
                        "h-4 w-4 text-secondary transition-transform duration-200",
                        state.openDropdowns[field.id] && "transform rotate-180",
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>

                  {state.openDropdowns[field.id] && (
                    <div
                      className="absolute z-10 w-full mt-1 py-1 rounded-lg border border-border
                                  bg-background shadow-lg
                                  max-h-60 overflow-auto"
                    >
                      {field.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleOptionSelect(field.id, option)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-foreground",
                            "hover:bg-muted focus:bg-muted outline-none",
                            "transition-colors duration-200",
                            state.selectedValues[field.id] === option &&
                              "bg-muted/50 font-medium",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="hidden"
                    name={field.id}
                    value={state.selectedValues[field.id] ?? ""}
                    required={field.required}
                  />
                </div>
              )}

              {field.type === "radio" && field.options && (
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${field.id}-${option}`}
                        name={field.id}
                        value={option}
                        required={field.required}
                        className="h-4 w-4 text-primary border-border focus:ring-ring"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === "checkbox" && field.options && (
                <div className="space-y-2">
                  {field.options.map((option) => {
                    // Initialize selections array if it doesn't exist
                    const selections = state.checkboxSelections[field.id] ?? [];
                    const isChecked = selections.includes(option);

                    return (
                      <label
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`${field.id}-${option}`}
                          checked={isChecked}
                          value={option}
                          className="h-4 w-4 text-primary border-border focus:ring-ring accent-primary"
                          onChange={(e) =>
                            handleCheckboxChange(
                              field.id,
                              option,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                  <input
                    type="hidden"
                    name={field.id}
                    value={state.checkboxSelections[field.id]?.join(",") ?? ""}
                  />
                </div>
              )}

              {field.type === "slider" && (
                <div className="space-y-3">
                  <input
                    type="range"
                    id={`${field.id}-range`}
                    min="0"
                    max={
                      field.sliderLabels && field.sliderLabels.length > 0
                        ? (field.sliderLabels.length - 1).toString()
                        : (field.sliderMax ?? 10).toString()
                    }
                    step="1"
                    value={
                      state.values[field.id]?.split(" : ")[0] ??
                      field.sliderDefault?.toString() ??
                      (field.sliderLabels && field.sliderLabels.length > 0
                        ? Math.floor(
                            (field.sliderLabels.length - 1) / 2,
                          ).toString()
                        : "5")
                    }
                    required={field.required}
                    className="w-full h-2 bg-muted rounded-lg cursor-pointer accent-primary"
                    onChange={(e) =>
                      handleSliderChange(field.id, e.target.value, field)
                    }
                  />
                  <input
                    type="hidden"
                    name={field.id}
                    value={
                      state.values[field.id] ?? getDefaultSliderValue(field)
                    }
                  />
                  {field.sliderLabels && field.sliderLabels.length > 0 ? (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {field.sliderLabels.map((label, index) => (
                        <span key={index}>{label}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min</span>
                      <span>Mid</span>
                      <span>Max</span>
                    </div>
                  )}
                </div>
              )}

              {field.type === "yes-no" && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleYesNoSelection(field.id, "Yes")}
                    className={cn(
                      "flex-1 px-4 py-2 border border-border rounded-lg cursor-pointer transition-colors",
                      state.yesNoSelections[field.id] === "Yes"
                        ? "bg-backdrop border-border text-container font-medium"
                        : "hover:bg-container",
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleYesNoSelection(field.id, "No")}
                    className={cn(
                      "flex-1 px-4 py-2 border border-border rounded-lg cursor-pointer transition-colors",
                      state.yesNoSelections[field.id] === "No"
                        ? "bg-backdrop border-border text-container font-medium"
                        : "hover:bg-container",
                    )}
                  >
                    No
                  </button>
                  <input
                    type="hidden"
                    id={field.id}
                    name={field.id}
                    value={state.yesNoSelections[field.id] ?? ""}
                    required={field.required}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg 
                     hover:bg-primary/90 focus:ring-2 focus:ring-ring
                     disabled:opacity-50 disabled:pointer-events-none
                     font-medium transition-colors duration-200"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                <span>Updating form...</span>
              </div>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    );
  },
);

FormComponent.displayName = "Form";

export { formVariants };
