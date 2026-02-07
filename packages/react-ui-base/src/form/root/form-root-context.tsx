import React from "react";

/**
 * Supported form field types.
 */
export type FormFieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "radio"
  | "checkbox"
  | "slider"
  | "yes-no";

/**
 * Definition of a single form field.
 */
export interface FormFieldDefinition {
  /** Unique identifier for the field. */
  id: string;
  /** Type of form field. */
  type: FormFieldType;
  /** Display label for the field. */
  label: string;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Options for select, radio, and checkbox fields. */
  options?: string[];
  /** Whether the field is required. */
  required?: boolean;
  /** Additional description text for the field. */
  description?: string;
  /** The minimum value for slider fields. */
  sliderMin?: number;
  /** The maximum value for slider fields. */
  sliderMax?: number;
  /** The step value for slider fields. */
  sliderStep?: number;
  /** Default value for slider fields. */
  sliderDefault?: number;
  /** Labels to display under slider. */
  sliderLabels?: string[];
}

/**
 * State of the form managed by Tambo component state.
 */
export interface FormState {
  /** Text/number/slider values keyed by field ID. */
  values: Record<string, string>;
  /** Open/closed state for dropdown fields keyed by field ID. */
  openDropdowns: Record<string, boolean>;
  /** Selected value for select fields keyed by field ID. */
  selectedValues: Record<string, string>;
  /** Yes/no selections keyed by field ID. */
  yesNoSelections: Record<string, string>;
  /** Checkbox selections keyed by field ID. */
  checkboxSelections: Record<string, string[]>;
}

/**
 * Context value shared among Form sub-components.
 */
export interface FormRootContextValue {
  /** The form state. */
  state: FormState;
  /** Callback to update the form state. */
  setState: (state: FormState) => void;
  /** The validated fields to render. */
  validFields: FormFieldDefinition[];
  /** Whether the form is currently generating (not idle). */
  isGenerating: boolean;
  /** Optional error message to display. */
  errorMessage?: string;
  /** Text for the submit button. */
  submitText: string;
  /** References to dropdown DOM elements for click-outside behavior. */
  dropdownRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  /** Handles form submission. */
  handleSubmit: (e: React.FormEvent) => void;
  /** Handles toggling a dropdown open/closed. */
  handleDropdownToggle: (fieldId: string) => void;
  /** Handles selecting an option in a dropdown. */
  handleOptionSelect: (fieldId: string, option: string) => void;
  /** Handles yes/no selection. */
  handleYesNoSelection: (fieldId: string, value: string) => void;
  /** Handles checkbox change. */
  handleCheckboxChange: (
    fieldId: string,
    option: string,
    checked: boolean,
  ) => void;
  /** Handles slider value change. */
  handleSliderChange: (
    fieldId: string,
    value: string,
    field: FormFieldDefinition,
  ) => void;
  /**
   * Calculates the default value for a slider field.
   * @returns The formatted default value in "value : label" format
   */
  getDefaultSliderValue: (field: FormFieldDefinition) => string;
}

const FormRootContext = React.createContext<FormRootContextValue | null>(null);

/**
 * Hook to access the form root context.
 * @returns The form root context value
 * @throws Error if used outside of Form.Root component
 */
function useFormRootContext(): FormRootContextValue {
  const context = React.useContext(FormRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: FormRootContext is missing. Form parts must be used within <Form.Root>",
    );
  }
  return context;
}

export { FormRootContext, useFormRootContext };
