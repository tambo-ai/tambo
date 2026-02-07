import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useElicitationUIContext } from "../root/elicitation-ui-context";

/**
 * Props passed to the Actions render function.
 */
export interface ElicitationUIActionsRenderProps {
  /** Whether the form is in single-entry mode. */
  isSingleEntry: boolean;
  /** Whether the form is currently valid for submission. */
  isValid: boolean;
  /** Submit handler (accept with current form data). */
  onAccept: () => void;
  /** Decline handler. */
  onDecline: () => void;
  /** Cancel handler. */
  onCancel: () => void;
}

export type ElicitationUIActionsProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ElicitationUIActionsRenderProps
>;

/**
 * Actions primitive for the elicitation UI.
 * Container for submit, decline, and cancel buttons.
 * In single-entry mode, provides only cancel and decline by default.
 * In multi-field mode, also provides a submit button.
 * @returns A div element containing action buttons
 */
export const ElicitationUIActions = React.forwardRef<
  HTMLDivElement,
  ElicitationUIActionsProps
>(({ asChild, ...props }, ref) => {
  const { isSingleEntry, isValid, handleAccept, handleDecline, handleCancel } =
    useElicitationUIContext();

  const Comp = asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    isSingleEntry,
    isValid,
    onAccept: handleAccept,
    onDecline: handleDecline,
    onCancel: handleCancel,
  });

  return (
    <Comp
      ref={ref}
      data-slot="elicitation-ui-actions"
      data-single-entry={isSingleEntry || undefined}
      {...componentProps}
    >
      {content ?? (
        <>
          <button
            type="button"
            onClick={handleCancel}
            data-slot="elicitation-ui-cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDecline}
            data-slot="elicitation-ui-decline-button"
          >
            Decline
          </button>
          {!isSingleEntry && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={!isValid}
              data-slot="elicitation-ui-submit-button"
            >
              Submit
            </button>
          )}
        </>
      )}
    </Comp>
  );
});
ElicitationUIActions.displayName = "ElicitationUI.Actions";
