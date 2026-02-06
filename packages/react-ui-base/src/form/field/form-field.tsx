import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import {
  FormFieldDefinition,
  useFormRootContext,
} from "../root/form-root-context";

export type FormFieldProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The field definition to render. */
    field: FormFieldDefinition;
  }
>;

/**
 * Field primitive that renders a single form field with its label, description, and input.
 * Handles all field types: text, number, select, textarea, radio, checkbox, slider, yes-no.
 * @returns The rendered field element
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField({ field, asChild, children, ...props }, ref) {
    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        data-slot="form-field"
        data-field-id={field.id}
        data-field-type={field.type}
        {...props}
      >
        {children ?? <FormFieldDefault field={field} />}
      </Comp>
    );
  },
);

/**
 * Props for the FormFieldLabel sub-component.
 */
export type FormFieldLabelProps = BaseProps<
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    /** The field definition. */
    field: FormFieldDefinition;
  }
>;

/**
 * Label primitive for a form field.
 * Displays the field label with a required indicator when applicable.
 * @returns The rendered label element
 */
export const FormFieldLabel = React.forwardRef<
  HTMLLabelElement,
  FormFieldLabelProps
>(function FormFieldLabel({ field, asChild, children, ...props }, ref) {
  const Comp = asChild ? Slot : "label";

  return (
    <Comp ref={ref} data-slot="form-field-label" htmlFor={field.id} {...props}>
      {children ?? (
        <>
          {field.label}
          {field.required && <span data-slot="form-field-required">*</span>}
        </>
      )}
    </Comp>
  );
});

/**
 * Props for the FormFieldDescription sub-component.
 */
export type FormFieldDescriptionProps = BaseProps<
  React.HTMLAttributes<HTMLParagraphElement> & {
    /** The field definition. */
    field: FormFieldDefinition;
  }
>;

/**
 * Description primitive for a form field.
 * Only renders when the field has a description.
 * @returns The rendered description element, or null if no description exists
 */
export const FormFieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FormFieldDescriptionProps
>(function FormFieldDescription({ field, asChild, children, ...props }, ref) {
  if (!field.description) {
    return null;
  }

  const Comp = asChild ? Slot : "p";

  return (
    <Comp ref={ref} data-slot="form-field-description" {...props}>
      {children ?? field.description}
    </Comp>
  );
});

/**
 * Props for the FormFieldInput sub-component.
 */
export type FormFieldInputProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The field definition. */
    field: FormFieldDefinition;
  }
>;

/**
 * Input primitive for a form field.
 * Renders the appropriate input element based on field type.
 * @returns The rendered input element
 */
export const FormFieldInput = React.forwardRef<
  HTMLDivElement,
  FormFieldInputProps
>(function FormFieldInput({ field, asChild, children, ...props }, ref) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="form-field-input" {...props}>
      {children ?? <FormFieldInputDefault field={field} />}
    </Comp>
  );
});

/**
 * Default field rendering including label, description, and input.
 * Used when no children are provided to FormField.
 */
function FormFieldDefault({ field }: { field: FormFieldDefinition }) {
  return (
    <>
      <FormFieldLabel field={field} />
      <FormFieldDescription field={field} />
      <FormFieldInputDefault field={field} />
    </>
  );
}

/**
 * Default input rendering that dispatches to type-specific renderers.
 */
function FormFieldInputDefault({ field }: { field: FormFieldDefinition }) {
  switch (field.type) {
    case "text":
      return <FormFieldText field={field} />;
    case "number":
      return <FormFieldNumber field={field} />;
    case "textarea":
      return <FormFieldTextarea field={field} />;
    case "select":
      return <FormFieldSelect field={field} />;
    case "radio":
      return <FormFieldRadio field={field} />;
    case "checkbox":
      return <FormFieldCheckbox field={field} />;
    case "slider":
      return <FormFieldSlider field={field} />;
    case "yes-no":
      return <FormFieldYesNo field={field} />;
  }
}

/**
 * Text input field.
 */
function FormFieldText({ field }: { field: FormFieldDefinition }) {
  return (
    <input
      type="text"
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      required={field.required}
      data-slot="form-field-text"
    />
  );
}

/**
 * Number input field.
 */
function FormFieldNumber({ field }: { field: FormFieldDefinition }) {
  return (
    <input
      type="number"
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      required={field.required}
      data-slot="form-field-number"
    />
  );
}

/**
 * Textarea field.
 */
function FormFieldTextarea({ field }: { field: FormFieldDefinition }) {
  return (
    <textarea
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      required={field.required}
      rows={4}
      data-slot="form-field-textarea"
    />
  );
}

/**
 * Select dropdown field.
 */
function FormFieldSelect({ field }: { field: FormFieldDefinition }) {
  const { state, dropdownRefs, handleDropdownToggle, handleOptionSelect } =
    useFormRootContext();

  if (!field.options) return null;

  return (
    <div
      data-slot="form-field-select"
      ref={(el) => {
        if (dropdownRefs.current) {
          dropdownRefs.current[field.id] = el;
        }
      }}
    >
      <button
        type="button"
        onClick={() => handleDropdownToggle(field.id)}
        data-slot="form-field-select-trigger"
        data-open={state.openDropdowns[field.id] || undefined}
      >
        <span
          data-slot="form-field-select-value"
          data-placeholder={!state.selectedValues[field.id] || undefined}
        >
          {state.selectedValues[field.id] ?? field.placeholder}
        </span>
        <svg
          data-slot="form-field-select-icon"
          data-open={state.openDropdowns[field.id] || undefined}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {state.openDropdowns[field.id] && (
        <div data-slot="form-field-select-options">
          {field.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleOptionSelect(field.id, option)}
              data-slot="form-field-select-option"
              data-selected={
                state.selectedValues[field.id] === option || undefined
              }
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
  );
}

/**
 * Radio button group field.
 */
function FormFieldRadio({ field }: { field: FormFieldDefinition }) {
  if (!field.options) return null;

  return (
    <div data-slot="form-field-radio">
      {field.options.map((option) => (
        <label key={option} data-slot="form-field-radio-option">
          <input
            type="radio"
            id={`${field.id}-${option}`}
            name={field.id}
            value={option}
            required={field.required}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * Checkbox group field.
 */
function FormFieldCheckbox({ field }: { field: FormFieldDefinition }) {
  const { state, handleCheckboxChange } = useFormRootContext();

  if (!field.options) return null;

  return (
    <div data-slot="form-field-checkbox">
      {field.options.map((option) => {
        const selections = state.checkboxSelections[field.id] ?? [];
        const isChecked = selections.includes(option);

        return (
          <label key={option} data-slot="form-field-checkbox-option">
            <input
              type="checkbox"
              id={`${field.id}-${option}`}
              checked={isChecked}
              value={option}
              onChange={(e) =>
                handleCheckboxChange(field.id, option, e.target.checked)
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
  );
}

/**
 * Slider/range field.
 */
function FormFieldSlider({ field }: { field: FormFieldDefinition }) {
  const { state, handleSliderChange, getDefaultSliderValue } =
    useFormRootContext();

  const maxValue =
    field.sliderLabels && field.sliderLabels.length > 0
      ? (field.sliderLabels.length - 1).toString()
      : (field.sliderMax ?? 10).toString();

  const currentValue =
    state.values[field.id]?.split(" : ")[0] ??
    field.sliderDefault?.toString() ??
    (field.sliderLabels && field.sliderLabels.length > 0
      ? Math.floor((field.sliderLabels.length - 1) / 2).toString()
      : "5");

  return (
    <div data-slot="form-field-slider">
      <input
        type="range"
        id={`${field.id}-range`}
        min="0"
        max={maxValue}
        step="1"
        value={currentValue}
        required={field.required}
        data-slot="form-field-slider-input"
        onChange={(e) => handleSliderChange(field.id, e.target.value, field)}
      />
      <input
        type="hidden"
        name={field.id}
        value={state.values[field.id] ?? getDefaultSliderValue(field)}
      />
      {field.sliderLabels && field.sliderLabels.length > 0 ? (
        <div data-slot="form-field-slider-labels">
          {field.sliderLabels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      ) : (
        <div data-slot="form-field-slider-labels">
          <span>Min</span>
          <span>Mid</span>
          <span>Max</span>
        </div>
      )}
    </div>
  );
}

/**
 * Yes/No toggle field.
 */
function FormFieldYesNo({ field }: { field: FormFieldDefinition }) {
  const { state, handleYesNoSelection } = useFormRootContext();

  return (
    <div data-slot="form-field-yesno">
      <button
        type="button"
        onClick={() => handleYesNoSelection(field.id, "Yes")}
        data-slot="form-field-yesno-option"
        data-selected={state.yesNoSelections[field.id] === "Yes" || undefined}
        data-value="yes"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => handleYesNoSelection(field.id, "No")}
        data-slot="form-field-yesno-option"
        data-selected={state.yesNoSelections[field.id] === "No" || undefined}
        data-value="no"
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
  );
}
